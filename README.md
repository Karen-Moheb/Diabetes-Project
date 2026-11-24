# Diabetes Care – Cloud-Based Diabetes Prediction System

## 1. Project Overview

Diabetes Care is a cloud-based web application designed to predict the risk of diabetes using Machine Learning.

The system allows users to create accounts, enter their health information, and receive a prediction result showing the predicted class and probability.

The project aims to support early risk assessment and improve healthcare accessibility through cloud technologies.

## 2. Project Objectives

- Predict diabetes risk using Machine Learning.
- Provide an easy-to-use web application.
- Store user data using cloud technologies.
- Support early risk assessment.
- Improve healthcare accessibility.

## 3. Technologies Used

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| Flask | Web application framework |
| HTML | Web page structure |
| CSS | User interface styling |
| JavaScript | Frontend functionality |
| Scikit-learn | Machine Learning |
| Random Forest | Diabetes prediction model |
| Neon PostgreSQL | Cloud database |
| Vercel | Cloud deployment |
| GitHub | Version control |

## 4. System Architecture

The system consists of the following components:

1. **User:** Accesses the application through a web browser.
2. **Frontend:** Built using HTML, CSS, and JavaScript.
3. **Flask Backend:** Handles user requests and application logic.
4. **Machine Learning Model:** Uses Random Forest to analyze health data and generate predictions.
5. **Neon PostgreSQL:** Stores application data in a cloud database.
6. **Prediction Result:** Returns the predicted class and probability to the user.

**Deployment:** The application is deployed on Vercel, and GitHub is used for source code management.

## 5. Main Features

- User Registration and Login.
- Health Assessment Form.
- Machine Learning-based Diabetes Prediction.
- Prediction Results with Probability.
- Admin Dashboard.
- User Data Management.
- Cloud Database Integration.

## 6. Dataset

The project uses the Pima Indians Diabetes Dataset from Kaggle.

Dataset Source:
https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database

## 7. Installation Instructions

### Prerequisites

- Python 3.x
- Git
- A Neon PostgreSQL database

### Clone the Repository

```bash
git clone https://github.com/Karen-Moheb/Diabetes-Project.git
cd Diabetes-Project-
```

### Create a Virtual Environment

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Create a `.env` file locally and configure the required environment variables, including:

- SECRET_KEY
- DATABASE_URL

Use your own values and never upload the `.env` file to GitHub.

### Run the Application

```bash
python app.py
```

Open the local application in your browser using the address displayed by Flask.

## 8. Deployment

The project uses cloud technologies for deployment and data management:

- **GitHub:** Source code repository and version control.
- **Vercel:** Hosts the web application.
- **Neon PostgreSQL:** Provides cloud database services.

The required environment variables must be configured in the deployment platform.

## 9. Results & Evaluation

The project evaluation showed:

- 25 registered users.
- 21 completed assessments.
- 4 positive predictions.
- 17 negative predictions.

Prediction reports display the result with a probability value.

## 10. Limitations

- Model prediction performance can be improved.
- Additional performance testing with multiple users is needed.
- User input validation can be improved.
- The system depends on the availability of the Neon PostgreSQL cloud database.

## 11. Future Work

- Improve Machine Learning prediction performance.
- Enhance input validation.
- Add more healthcare features.
- Improve system scalability and performance.

## 12. References

- Flask Documentation: https://flask.palletsprojects.com/
- Scikit-learn Documentation: https://scikit-learn.org/stable/
- Neon Documentation: https://neon.com/docs
- Vercel Documentation: https://vercel.com/docs
- Python Documentation: https://docs.python.org/3/
- Pima Indians Diabetes Dataset: https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database

---

**Diabetes Care | Cloud Computing Project 2026**
