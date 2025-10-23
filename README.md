# Ekaa Registration Portal

This is a full-stack web application for Ekaa Registration, built with Java 17, Spring Boot 3, and a simple HTML/CSS/JS frontend.

## Technology Stack

*   **Backend:** Java 17, Spring Boot 3, Hibernate/JPA
*   **Database:** MySQL
*   **Build Tool:** Maven
*   **Frontend:** HTML, CSS, JavaScript, jQuery, Tailwind CSS

## Prerequisites

*   Java 17 or later
*   Maven 3.2+
*   MySQL Server

## Database Setup

1.  Make sure you have MySQL running.
2.  Create a database named `ekaa_portal`:

    ```sql
    CREATE DATABASE ekaa_portal;
    ```

3.  Open `src/main/resources/application.properties` and update the following properties with your MySQL username and password:

    ```properties
    spring.datasource.username=your-username
    spring.datasource.password=your-password
    ```

## How to Run

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd EkaaRegistrationPortal
    ```

2.  **Build the project using Maven:**

    ```bash
    mvn clean install
    ```

3.  **Run the application:**

    ```bash
    mvn spring-boot:run
    ```

    The application will start on `http://localhost:8080`.

## Usage

*   **Registration Form:** Open `http://localhost:8080/registration.html` in your browser.
*   **Admin Panel:** Open `http://localhost:8080/admin.html` to view all registrations.
