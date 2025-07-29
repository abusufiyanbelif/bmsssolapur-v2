# **App Name**: Baitul Mal Connect: Visualizer

## Core Features:

- Dashboard: Dashboard Visualization: Display key metrics and data points from the Firebase project, like recent donations or upcoming events.
- Services Summary: Configuration Overview: List all Firebase services used (Authentication, Hosting) and other services (like Twilio, Nodemailer). Display associated configuration details like project IDs and billing account IDs.
- Dependency Graph: Dependency Map: Generate a visual diagram illustrating the connections and dependencies between the different Firebase services, and external services, such as the relationships between hosting, authentication, and the database, or the relationship between the LLM, Twilio and Nodemailer.
- Configuration Validator: Configuration Validator: The LLM acts as a tool; it checks the configuration for potential misconfigurations or security vulnerabilities.

## Style Guidelines:

- Primary color: A saturated blue (#4285F4), reflecting trust, stability, and connectivity, vital for managing connected services.
- Background color: A very light blue (#F0F4FF), close in hue to the primary color, to maintain visual consistency and reduce eye strain.
- Accent color: A contrasting orange (#FFA000) to draw attention to interactive elements and important notifications.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines and 'Inter' (sans-serif) for body text, for a clean, modern and technical look.
- Use a set of modern, minimalist icons, with line weights carefully chosen to complement the font choices, to represent the various services (database, hosting, AI, etc.).
- Implement a clean, grid-based layout to neatly organize the visualized services and configuration details. Use clear, well-defined sections to group related information for easy navigation.
- Use subtle animations to transition between views and highlight changes in configuration or status.