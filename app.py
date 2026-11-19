import os
import joblib
import pandas as pd
import re
from functools import wraps
from flask import Flask, request, jsonify, render_template, redirect
from werkzeug.security import generate_password_hash, check_password_hash
from database import db, User, Assessment, ContactMessage
from config import Config
from flask_login import LoginManager
from flask_login import login_user, logout_user, login_required, current_user

app = Flask(__name__)

app.config.from_object(Config)

# Database configuration
os.makedirs(app.instance_path, exist_ok=True)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "sqlite:///" + os.path.join(app.instance_path, "diabetes.db")
)

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login_page"


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


def get_admin_emails():
    raw = os.environ.get("ADMIN_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def is_admin(user):
    return bool(
        user
        and user.is_authenticated
        and user.role == "admin"
    )


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"message": "Login required."}), 401
        if not is_admin(current_user):
            return jsonify({"message": "Admin access only."}), 403
        return f(*args, **kwargs)
    return wrapper


@login_manager.unauthorized_handler
def unauthorized():
    if request.path.startswith("/api/"):
        return jsonify({"message": "Login required."}), 401
    return redirect("/login")


# Load AI model files
model = joblib.load("models/model.pkl")
scaler = joblib.load("models/scaler.pkl")
columns = joblib.load("models/columns.pkl")
medians = joblib.load("models/medians.pkl")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/signup")
def signup_page():
    return render_template("pages/signup.html")


@app.route("/login")
def login_page():
    return render_template("pages/login.html")


@app.route("/admin-dashboard")
@login_required
def admin_dashboard_page():
    if not is_admin(current_user):
        return redirect("/")
    return render_template("pages/admin-dashboard.html")


@app.route("/form")
def form_page():
    return render_template("pages/from.html")


@app.route("/prediction")
def prediction_page():
    return render_template("pages/prediction.html")


@app.route("/history")
@login_required
def history_page():
    return render_template("pages/history.html")


@app.route("/contact")
def contact_page():
    return render_template("pages/contact.html")

# Patient Registration


@app.route("/api/signup", methods=["POST"])
def signup():

    data = request.get_json(silent=True) or {}

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    gender = data.get("gender") or None
    password = data.get("password", "")

    # Check required fields
    if not username or not email or not phone or not password:
        return jsonify({
            "message": "Please fill in all required fields."
        }), 400

    # Check password length
    if len(password) < 8:
        return jsonify({
            "message": "Password must be at least 8 characters."
        }), 400
# Check password complexity
    if not re.search(r"[A-Z]", password) or not re.search(r"[a-z]", password):
        return jsonify({
            "message": "Password must contain both uppercase and lowercase letters."
        }), 400

    if not re.search(r"[0-9]", password):
        return jsonify({
            "message": "Password must contain at least one number."
        }), 400

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return jsonify({
            "message": "Password must contain at least one special character."
        }), 400
    # Check if email already exists
    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "message": "Email is already registered."
        }), 409

    # Check if username already exists
    existing_username = User.query.filter_by(username=username).first()

    if existing_username:
        return jsonify({
            "message": "Username is already taken."
        }), 409

    # Create new user
    new_user = User(
        username=username,
        email=email,
        phone=phone,
        gender=gender,
        password_hash=generate_password_hash(password)
    )

    db.session.add(new_user)
    db.session.commit()

    logout_user()

    return jsonify({
        "message": "Account created successfully!"
    }), 201


@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({
            "message": "Please enter username and password."
        }), 400

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({
            "message": "Invalid username or password."
        }), 401

    login_user(user)

    return jsonify({
        "message": "Login successful!",
        "username": user.username,
        "email": user.email,
        "is_admin": is_admin(user)
    }), 200


@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_users():

    users = User.query.order_by(User.id.desc()).all()

    return jsonify([
        {
            "id": user.id,
            "username": user.username,
            "name": user.username,
            "email": user.email,
            "phone": user.phone,
            "gender": user.gender or "",
            "memberSince": (
                user.created_at.strftime("%Y-%m-%d")
                if user.created_at else "—"
            )
        }
        for user in users
    ]), 200


@app.route("/api/predict", methods=["POST"])
@login_required
def predict():

    data = request.get_json(silent=True) or {}

    # Expected model features
    try:
        input_data = {
            "Pregnancies": float(data["Pregnancies"]),
            "Glucose": float(data["Glucose"]),
            "BloodPressure": float(data["BloodPressure"]),
            "SkinThickness": float(data["SkinThickness"]),
            "Insulin": float(data["Insulin"]),
            "BMI": float(data["BMI"]),
            "DiabetesPedigreeFunction": float(data["DiabetesPedigreeFunction"]),
            "Age": float(data["Age"])
        }
    except (KeyError, TypeError, ValueError):
        return jsonify({
            "message": "Please provide all 8 valid health values."
        }), 400

    # Validate values
    if any(value < 0 for value in input_data.values()):
        return jsonify({
            "message": "Values cannot be negative."
        }), 400

    # Arrange features in the exact training order
    patient_data = pd.DataFrame([input_data], columns=columns)

    # Replace invalid zeros with missing values
    zero_columns = [
        "Glucose",
        "BloodPressure",
        "SkinThickness",
        "Insulin",
        "BMI"
    ]

    patient_data[zero_columns] = patient_data[zero_columns].replace(
        0, float("nan"))

    # Fill missing values using saved training medians
    patient_data = patient_data.fillna(medians)

    # Apply the saved scaler
    scaled_data = scaler.transform(patient_data)

    # Run the trained model
    prediction = int(model.predict(scaled_data)[0])

    probabilities = model.predict_proba(scaled_data)[0]
    positive_class_index = list(model.classes_).index(1)
    probability = float(probabilities[positive_class_index] * 100)

    new_assessment = Assessment(
        user_id=current_user.id,
        pregnancies=input_data["Pregnancies"],
        glucose=input_data["Glucose"],
        blood_pressure=input_data["BloodPressure"],
        skin_thickness=input_data["SkinThickness"],
        insulin=input_data["Insulin"],
        bmi=input_data["BMI"],
        diabetes_pedigree_function=input_data["DiabetesPedigreeFunction"],
        age=input_data["Age"],
        prediction=prediction,
        probability=round(probability, 2)
    )

    db.session.add(new_assessment)
    db.session.commit()

    return jsonify({
        "prediction": prediction,
        "probability": round(probability, 2),
        "message": "Prediction completed successfully."
    }), 200


@app.route("/api/my-assessments", methods=["GET"])
@login_required
def my_assessments():
    assessments = Assessment.query.filter_by(
        user_id=current_user.id
    ).order_by(Assessment.created_at.desc()).all()

    results = []

    for a in assessments:
        results.append({
            "id": a.id,
            "prediction": a.prediction,
            "probability": a.probability,
            "created_at": a.created_at.isoformat(),
            "glucose": a.glucose,
            "bmi": a.bmi,
            "age": a.age
        })

    return jsonify(results), 200


@app.route("/api/admin/assessments", methods=["GET"])
@admin_required
def admin_assessments():

    assessments = Assessment.query.order_by(
        Assessment.created_at.desc()
    ).all()

    results = []

    for a in assessments:
        results.append({
            "id": a.id,
            "user": a.user.username if a.user else "Guest",
            "date": a.created_at.strftime("%Y-%m-%d %H:%M:%S") if a.created_at else "",
            "glucose": a.glucose,
            "bloodPressure": a.blood_pressure,
            "bmi": a.bmi,
            "age": a.age,
            "probability": a.probability,
            "result": a.prediction
        })

    return jsonify(results), 200


@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully!"}), 200


@app.route("/api/contact", methods=["POST"])
def submit_contact():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    message = data.get("message", "").strip()

    if not name or not email or not message:
        return jsonify({"message": "Please fill in all fields."}), 400

    new_message = ContactMessage(
        name=name,
        email=email,
        message=message
    )

    db.session.add(new_message)
    db.session.commit()

    return jsonify({
        "message": "Your message has been sent successfully!"
    }), 201


@app.route("/api/admin/messages", methods=["GET"])
@admin_required
def admin_messages():
    messages = ContactMessage.query.order_by(
        ContactMessage.created_at.desc()
    ).all()

    return jsonify([
        {
            "id": msg.id,
            "name": msg.name,
            "email": msg.email,
            "message": msg.message,
            "date": msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
            if msg.created_at else "",
            "read": msg.is_read
        }
        for msg in messages
    ]), 200


@app.route("/api/admin/messages/<int:message_id>/read", methods=["POST"])
@admin_required
def mark_message_read(message_id):
    message = db.session.get(ContactMessage, message_id)

    if not message:
        return jsonify({"message": "Message not found."}), 404

    data = request.get_json(silent=True) or {}
    message.is_read = data.get("read", True)

    db.session.commit()

    return jsonify({"message": "Message status updated."}), 200


@app.route("/api/admin/messages/<int:message_id>", methods=["DELETE"])
@admin_required
def delete_message(message_id):
    message = db.session.get(ContactMessage, message_id)

    if not message:
        return jsonify({"message": "Message not found."}), 404

    db.session.delete(message)
    db.session.commit()

    return jsonify({"message": "Message deleted successfully."}), 200


# Create database tables
with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=False)
