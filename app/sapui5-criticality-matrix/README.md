# SAPUI5 Criticality Matrix

This project implements a custom SAPUI5 control for a criticality matrix. The matrix displays criticality codes ranging from 1A to 5D, with each cell color-coded based on its criticality level. The color options are white, green, orange, and red.

## Project Structure

The project is organized as follows:

```
sapui5-criticality-matrix
├── webapp
│   ├── control
│   │   └── CriticalityMatrix.js       # Custom control for the criticality matrix
│   ├── view
│   │   └── App.view.xml                # XML view definition for the application
│   ├── controller
│   │   └── App.controller.js           # Controller for handling user interactions
│   ├── i18n
│   │   └── i18n.properties              # Internationalization properties
│   ├── css
│   │   └── style.css                    # CSS styles for the application
│   ├── index.html                       # Entry point for the application
│   └── manifest.json                    # Application descriptor
├── ui5.yaml                             # UI5 tooling configuration
├── package.json                         # npm configuration file
└── README.md                            # Project documentation
```

## Setup Instructions

1. **Clone the Repository**: 
   Clone this repository to your local machine using:
   ```
   git clone <repository-url>
   ```

2. **Install Dependencies**: 
   Navigate to the project directory and install the required npm packages:
   ```
   npm install
   ```

3. **Run the Application**: 
   Start the application using the UI5 tooling:
   ```
   ui5 serve
   ```

4. **Access the Application**: 
   Open your web browser and navigate to `http://localhost:8080` to view the application.

## Usage

The CriticalityMatrix control can be instantiated in the `App.view.xml` file. It is designed to handle various criticality codes and display them in a grid format, with appropriate color coding for each cell based on its criticality level.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.