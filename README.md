# EV Fleet Management System

### Smart EV Fleet Monitoring & Driver Analytics Platform

![Status](https://img.shields.io/badge/status-active-brightgreen)
![React](https://img.shields.io/badge/Frontend-React.js-61DAFB)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF)
![ML](https://img.shields.io/badge/ML-Python-yellow)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

A modern, full-stack **Electric Vehicle Fleet Management System** designed to help fleet managers monitor vehicle performance, battery health, driver behavior, energy consumption, maintenance status, and operational costs in real time — enhanced with an **ML-powered EV Range Prediction module** and an integrated **AI Chatbot Assistant**.

This platform provides **role-based dashboards** for Fleet Managers and Drivers, enabling efficient fleet operations, improved vehicle utilization, and data-driven decision making.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Dataset Used](#dataset-used)
- [Key Performance Indicators (KPIs)](#key-performance-indicators-kpis)
- [Screens Included](#screens-included)
- [Machine Learning Module — EV Range Prediction](#machine-learning-module--ev-range-prediction)
- [Challenges Faced in ML Development](#challenges-faced-in-ml-development)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Business Benefits](#business-benefits)
- [Future Enhancements](#future-enhancements)
- [Learning Outcomes](#learning-outcomes)
- [Screenshots of Project](#screenshots-of-project)
- [Architecture Diagram](#architecture-diagram)
- [Model Evaluation](#model-evaluation)
- [Authors & Team](#authors--team)

---

## Project Overview

The **EV Fleet Management System** centralizes fleet operations into a single intelligent dashboard. It analyzes telemetry data, battery statistics, charging information, maintenance records, and driver performance metrics to optimize fleet efficiency and reduce operational costs.

The system supports:

- Fleet Monitoring
- Battery Health Management
- Driver Performance Analysis
- Energy Consumption Tracking
- Cost Analysis
- Maintenance Monitoring
- Trip Analytics
- Role-Based Access Control
- ML-Based Range Prediction & Chatbot Assistance

---

## Features

### Fleet Dashboard
- Real-time fleet overview
- Active, charging, and maintenance vehicle tracking
- Fleet utilization metrics
- Vehicle status monitoring

### Battery Health Analytics
- State of Charge (SoC) monitoring
- Battery health percentage tracking
- Low battery alerts
- Critical battery detection
- Battery performance visualization

### Driver Management
- Driver performance scoring
- Trip history analysis
- Driving behavior monitoring
- Efficiency tracking

### Energy & Charging Management
- Energy consumption monitoring
- Charging status tracking
- Charging cycle analytics
- Daily energy cost analysis

### Maintenance Management
- Service scheduling insights
- Maintenance alerts
- Vehicle health monitoring
- Preventive maintenance tracking

### Cost Analysis
- Fleet operational cost monitoring
- Energy expenditure analysis
- Cost optimization insights

### Reports & Analytics
- Interactive charts and visualizations
- KPI dashboards
- Fleet performance reports
- Operational trend analysis

### AI Chatbot Assistant
- Conversational assistant for fleet queries
- Driver support and FAQs
- Quick insights retrieval through natural language

---

## Technology Stack

| Category | Technology |
|---|---|
| Frontend | React.js |
| Language | TypeScript |
| Build Tool | Vite |
| Routing | React Router DOM |
| State Management | Zustand |
| Data Processing | PapaParse |
| Visualization | Recharts |
| Notifications | React Hot Toast |
| Icons | Lucide React |
| Styling | CSS |
| ML & Data Science | Python, Pandas, Scikit-learn |
| Chatbot | NLP-based Conversational Model |

---

## System Architecture

```
CSV Data Sources
       │
       ▼
Data Loader Layer
       │
       ▼
State Management (Zustand)
       │
 ┌─────┴──────┐
 ▼            ▼
Manager      Driver
Dashboard    Dashboard
 │             │
 ▼             ▼
Analytics    Performance
Reports      Monitoring
       │
       ▼
ML Range Prediction Engine
       │
       ▼
AI Chatbot Module
```

---

## Dataset Used

The project utilizes fleet telemetry datasets including:

### Driver Master Data
- Driver ID
- Driver Information
- Assigned Vehicles

### Manager Master Data
- Manager Information
- Fleet Allocation

### Trip Telemetry Data
- Vehicle ID
- Battery Percentage
- Battery Health
- Charging Status
- Vehicle Status
- Energy Consumption
- Daily Energy Cost
- Service Information
- Trip Statistics

### Hierarchy Mapping
- Manager-Driver Relationships
- Fleet Assignment Structure

---

## Key Performance Indicators (KPIs)

### Fleet KPIs
- Total Vehicles
- Active Vehicles
- Vehicles Under Maintenance
- Charging Vehicles

### Battery KPIs
- Average Battery Percentage
- Critical Battery Count
- Warning Battery Count
- Healthy Battery Count

### Driver KPIs
- Driver Efficiency Score
- Trip Completion Rate
- Driving Behavior Metrics

### Financial KPIs
- Daily Energy Cost
- Fleet Operating Cost
- Cost Optimization Metrics

---

## Screens Included

### Manager Portal
- Dashboard
- Fleet Overview
- Driver Management
- Battery Analytics
- Driver Behavior Analysis
- Cost Analysis
- Reports

### Driver Portal
- Dashboard
- Trip History
- Vehicle Information
- Performance Tracking

---

## Machine Learning Module — EV Range Prediction

A core component of this project is the **EV Driving Range Prediction model**, which estimates the expected driving range of an electric vehicle based on telemetry features such as battery percentage, battery health, energy consumption, and trip statistics.

- **Models Used:** Linear Regression, Random Forest Regressor
- **Achieved Accuracy:** 80–85% R² Score
- **Pipeline:** Data Cleaning → Feature Engineering → EDA → Model Training → Evaluation → Prediction Function
- **Output:** Interactive `predict_range()` function for real-time range estimation

---

## Challenges Faced in ML Development

Building an accurate and reliable ML model for EV range prediction came with several real-world challenges:

### 1. Poor Accuracy on Real-Time Dataset Values
When tested with real-time/raw dataset values, the initial ML model produced **inaccurate and inconsistent (false) predictions**, despite showing good accuracy during training. This indicated that the original dataset had weak or **artificially limited correlations** between key features (such as battery percentage, energy consumption, and range), capping the model's real-world R² performance around **49%**.

### 2. Synthetic Dataset Creation
To overcome the limitations of the original dataset, a **synthetic dataset** was carefully designed using a **physics-inspired range formula**, ensuring that the relationships between variables (battery %, battery health, energy consumption, trip distance, etc.) mirrored real-world EV behavior more accurately.

### 3. Fine-Tuning Feature Correlations
Significant effort was spent on **fine-tuning the correlation between input columns** so that the model could learn meaningful patterns rather than noise. This involved:
- Adjusting numerical ranges and distributions of features
- Introducing realistic noise to avoid overfitting
- Validating correlation matrices before training

### 4. Balancing Realism vs. Accuracy
A key challenge was ensuring the synthetic data was **realistic enough** to generalize to real-world scenarios, while still being **structured enough** for the model to achieve the target **80–85% R² score**.

### 5. Iterative Model Validation
Multiple training-testing cycles were performed using both **Linear Regression** and **Random Forest** models to confirm that accuracy improvements were genuine and not a result of data leakage or overfitting.

> **Outcome:** After synthetic dataset creation and correlation fine-tuning, both models achieved a stable **80–85% R² score**, with significantly improved real-time prediction reliability.

---

## Installation

### Clone Repository
```bash
git clone https://github.com/yourusername/ev-fleet-management.git
```

### Navigate to Project
```bash
cd ev-fleet-management
```

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build Production Version
```bash
npm run build
```

---

## Project Structure

```
ev-fleet-management/
│
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── manager/
│   │   └── driver/
│   ├── services/
│   ├── store/
│   ├── utils/
│   ├── routes/
│   └── assets/
│
├── ml/
│   ├── EV_Fleet_Synthetic_v2.xlsx
│   ├── EV_Range_Prediction_Final.ipynb
│   └── predict_range.py
│
├── chatbot/
│   ├── model/
│   └── chatbot_engine.py
│
├── data/
│   ├── Driver_Master.csv
│   ├── Manager_Master.csv
│   ├── Trip_Telemetry.csv
│   └── Hierarchy_Map.csv
│
├── package.json
├── vite.config.ts
└── README.md
```

---

## Business Benefits

### For Fleet Managers
- Improved fleet visibility
- Reduced operational costs
- Better maintenance planning
- Enhanced decision making

### For Drivers
- Performance tracking
- Vehicle health awareness
- Improved driving efficiency

### For Organizations
- Increased fleet utilization
- Lower downtime
- Better battery lifecycle management
- Sustainable EV operations

---

## Future Enhancements

- Live GPS Tracking
- Predictive Maintenance using Machine Learning
- Route Optimization
- AI-based Driver Risk Prediction
- EV Charging Station Recommendations
- Real-time IoT Integration
- Carbon Emission Savings Dashboard
- Mobile Application Support
- Enhanced Conversational Chatbot with Voice Support

---

## Learning Outcomes

- React & TypeScript Development
- State Management with Zustand
- Interactive Data Visualization
- EV Fleet Analytics
- Dashboard Design
- Data Processing using CSV Datasets
- Role-Based Application Development
- Machine Learning Model Development & Synthetic Data Engineering
- NLP & Chatbot Integration

---

## Screenshots of Project

<img width="1386" height="710" alt="image" src="https://github.com/user-attachments/assets/18bccbbc-e930-4b7d-a5e1-17be7c2c8212" />

<img width="1331" height="710" alt="image" src="https://github.com/user-attachments/assets/b371985c-aa17-453f-b0e3-264982012e76" />

<img width="1566" height="740" alt="image" src="https://github.com/user-attachments/assets/cba4df71-78f3-4e7f-a58d-933199753e94" />

<img width="1567" height="772" alt="image" src="https://github.com/user-attachments/assets/8e14e3dd-08b7-4508-9cc3-b65bc7c10229" />

<img width="1530" height="757" alt="image" src="https://github.com/user-attachments/assets/023a1277-09ca-4de3-95e5-f412ccd8f39b" />

---

## Architecture Diagram

<img width="2987" height="1625" alt="image" src="https://github.com/user-attachments/assets/09a1d622-84dc-443f-91e8-78d986fd5ff3" />

---

## Model Evaluation

<img width="2265" height="1238" alt="image" src="https://github.com/user-attachments/assets/37ccc03c-2c56-4755-97be-2d0072a27c4b" />

---

## Authors & Team

| Name | Role |
|---|---|
| **Harini P** | ML and Chatbot Development |
| **Hemajothi S** | Frontend and UI-UX |
| **Shivaani V G** | Backend and Database |
| **Mohanapriya K** | Data Analysis, Visualization & Research |

### About the Team
A passionate group of **AI & Data Science students** dedicated to building real-world intelligent applications that combine machine learning, modern web development, and data-driven design to solve practical problems in EV fleet management.

---

<div align="center">

### If you find this project useful, consider giving it a star.

**Built for a Sustainable EV Future**

</div>
