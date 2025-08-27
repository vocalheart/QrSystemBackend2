QRVibe - Visitor Management Platform
 
QRVibe is a modern, user-friendly web application designed to streamline visitor management for organizations. Built with React and Tailwind CSS, QRVibe offers a seamless experience for scheduling personalized demo sessions, generating QR codes for visitor check-ins, and managing visitor data efficiently. The platform features a responsive design, light/dark mode support, and robust accessibility to ensure inclusivity.
Features

Demo Request Form: Schedule personalized demos with a professional form featuring client-side validation and submission feedback.
QR Code Generation: Create QR codes for secure and efficient visitor check-ins (via QRForm.jsx).
Responsive Design: Fully responsive UI that adapts to mobile, tablet, and desktop screens.
Light/Dark Mode: Seamless theme switching for enhanced user experience in different lighting conditions.
Accessibility: ARIA attributes and high-contrast design ensure the platform is accessible to all users.
Toast Notifications: User-friendly feedback for form submissions using react-hot-toast.
Modern Styling: Gradient-based design with Tailwind CSS and Heroicons for a polished, professional look.

Tech Stack

Frontend: React (v18), React Router (v6), Tailwind CSS (v3)
Icons: @heroicons/react (v2)
Notifications: react-hot-toast (v2)
Build Tool: Vite (v5)
JavaScript: ES Modules, modern syntax
Dependencies: Managed via npm

Prerequisites
Before setting up the project, ensure you have the following installed:

Node.js (v16 or higher)
npm (v8 or higher)
A modern web browser (e.g., Chrome, Firefox)

Installation

Clone the Repository:
git clone https://github.com/your-username/qrvibe.git
cd qrvibe


Install Dependencies:
npm install


Run the Development Server:
npm run dev

Open http://localhost:5173 in your browser to view the application.

Build for Production:
npm run build

The production-ready files will be generated in the dist directory.


Usage
Navigating the Website

Home Page (/): The landing page with an overview of QRVibe’s features and a call-to-action to request a demo or generate a QR code.
Demo Page (/demo): A form (Demo.jsx) to schedule a personalized demo session. Users enter their name, email, phone number, and optional message. The form includes client-side validation and toast notifications for submission feedback.
QR Code Generation (/qrform): A form (QRForm.jsx) to generate QR codes for visitor check-ins (assumed feature).
Navigation: The Navbar.jsx component provides links to Home, Demo, and QR Form pages, with a responsive design and animated icons.

Demo Form Workflow

Navigate to /demo via the "Get a Demo" link in the navigation bar.
Fill out the form with:
Full Name (required)
Email Address (required, valid email format)
Phone Number (required, valid phone format)
Message (optional)


Submit the form to receive a success toast (Demo request submitted successfully!) and be redirected to the home page.
If validation fails, error messages appear below the respective fields in pink (text-pink-500).

Styling and Accessibility

Styling: The website uses Tailwind CSS with a pink/purple gradient theme (bg-gradient-to-r from-pink-600 to-purple-700) for a professional look. Buttons feature hover effects (hover:scale-105, hover:shadow-lg) and focus rings (focus:ring-pink-600).
Accessibility: ARIA attributes (aria-required, aria-label, aria-describedby, aria-invalid) ensure screen reader compatibility. High-contrast colors support light and dark modes.

Project Structure
qrvibe/
├── public/
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Demo.jsx        # Demo request form with validation and toasts
│   │   ├── Navbar.jsx      # Navigation bar with links and responsive design
│   │   └── QRForm.jsx     # QR code generation form (assumed)
│   ├── App.jsx            # Main app component with routing
│   ├── index.css          # Global styles with Tailwind CSS
│   └── main.jsx           # Entry point for React
├── package.json           # Project dependencies and scripts
├── vite.config.js         # Vite configuration
└── README.md              # Project documentation

Contributing
We welcome contributions to QRVibe! To contribute:

Fork the Repository:
git clone https://github.com/your-username/qrvibe.git


Create a Branch:
git checkout -b feature/your-feature-name


Make Changes:

Follow the coding style (ESLint, Prettier recommended).
Ensure components are responsive and accessible.
Test changes locally with npm run dev.


Submit a Pull Request:

Push your branch to your fork:git push origin feature/your-feature-name


Open a pull request on the main repository with a clear description of your changes.


Code Review:

Address feedback from maintainers.
Ensure tests (if added) pass.



Please adhere to the Code of Conduct in all interactions.
License
This project is licensed under the MIT License.
Contact
For questions or support, contact the project maintainer:

Email: your.email@example.com
GitHub Issues: Open an issue


Thank you for exploring QRVibe! We look forward to your feedback and contributions to make visitor management seamless and efficient.
