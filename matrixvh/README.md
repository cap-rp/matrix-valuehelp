# Getting Started

Welcome to your new project.

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code go here
`package.json` | project metadata and configuration
`readme.md` | this getting started guide


## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).


## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.

# matrixvh UI5 library

Usage (local link)
1. In library folder:
   npm install
   npm run build
   npm link

2. In your UI5 app:
   npm link @your-org/matrixvh

3. Add resource root mapping in index.html:
   data-sap-ui-resourceroots='{"matrixvh":"./node_modules/@your-org/matrixvh/resources/matrixvh"}'

4. Use controls in XML view:
   xmlns:mv="matrixvh.control"
   <mv:CriticalityField value="{ActionItems/Criticality}" cellsPath="/CriticalityCells" modelName="odata" />

Or directly:
   <mv:CriticalityMatrix cellsPath="/CriticalityCells" modelName="odata" />
