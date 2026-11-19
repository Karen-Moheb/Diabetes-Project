from getpass import getpass
from app import app
from database import db, User
from werkzeug.security import generate_password_hash


with app.app_context():

    print("=== Create Admin Account ===")

    username = input("Enter username: ").strip()
    email = input("Enter email: ").strip().lower()
    phone = input("Enter phone: ").strip()
    password = getpass("Enter password: ")

    if not username or not email or not phone or not password:
        print("All fields are required.")
    elif len(password) < 8:
        print("Password must be at least 8 characters.")
    elif User.query.filter_by(email=email).first():
        print("This email is already registered.")
    elif User.query.filter_by(username=username).first():
        print("This username is already taken.")
    else:
        admin = User(
            username=username,
            email=email,
            phone=phone,
            password_hash=generate_password_hash(password),
            role="admin"
        )

        db.session.add(admin)
        db.session.commit()

        print("Admin account created successfully!")
