# Project Progress Log - Wevini App

This file serves as the official record of the project's evolution, technical decisions, and current state.

## 🚀 Current Status
- **Backend:** Functional Express server converted to Stored Procedures for all data access.
- **Frontend:** React application with specialized views for POS, Catalog, Products, Inventory, and Customers.
- **Authentication:** Fully implemented (JWT + bcrypt).
- **Modules Completed:** Login, Product Master (CRUD), Customer Master (CRUD), Supplier Master (CRUD), Stock Inventory (Read-only).

---

## 📝 Development History

### Phase 1: Infrastructure & Authentication
- **Database Connection:** 
    - Established connection to SQL Server (`wevini_db`) on port 1434.
    - Configured environment variables in `.env`.
- **Auth System:**
    - Created `dim_usuarios` table.
    - Implemented `/api/login` endpoint with JWT token generation.
    - Built a professional Login view in the frontend.
    - Implemented route protection (only authenticated users can access the app).
    - Added Logout functionality in the Sidebar.

### Phase 2: Product Master (Inventory)
- **Database Schema Integration:**
    - Integrated `dim_productos`, `dim_clases`, `dim_unidades_medida`, and `dim_producto_precios`.
- **Backend Logic:**
    - Developed CRUD endpoints for products.
    - Created helper endpoints for catalogs (units and classes).
    - Implemented price presentation management for products.
- **Frontend UI:**
    - Completely redesigned `Inventory.tsx`.
    - Implemented a data table with search and filter capabilities.
    - Built a complex Modal for product registration/editing including:
        - General info, Classification, Logistics (Units & Conversion), and Financials.
        - Dynamic table for managing multiple price presentations.

### Phase 3: Design & UX Optimization
- **Typographical Scaling:** Increased font sizes across the app (`Sidebar`, `Topbar`, `Login`, `Inventory`) to improve readability.
- **Spacing Adjustments:** Reduced vertical gaps in the Inventory view to create a more compact and professional layout.

### Phase 4: Customer Master
- **Database Integration:**
    - Integrated `dim_clientes` table for customer management.
- **Backend Logic:**
    - Implemented full CRUD endpoints for customers.
    - Added logic for handling customer types (Minorista, Mayorista, Distribuidor).
- **Frontend UI:**
    - Created `Customers.tsx` view with a professional data table.
    - Built a comprehensive Modal organized by sections: Identification, Commercial Details, Finance, Contact, and Location.
    - Implemented a robust search system by code, RUC/DNI, or Reason Social.

### Phase 4.1: Supplier Master
- **Database Integration:**
    - Integrated `dim_proveedores` table.
- **Backend Logic:**
    - Implemented full CRUD endpoints for suppliers with soft delete support.
- **Frontend UI:**
    - Created `Suppliers.tsx` view following the Customer Master design pattern.
    - Implemented a multi-section Modal (Identification, Commercial, Finance, Contact, Location).
    - Integrated Supplier management into the main navigation.

### Phase 5: State Management & Soft Delete
- **Soft Delete Implementation:** Standardized the use of the `activo` column across Products and Customers to avoid permanent data loss.
- **Administrative Visibility:** Updated Backend endpoints to support a `?all=true` parameter, allowing administrators to see and reactivate inactive records while keeping them hidden from operational views (like the POS).

### Phase 6: UI/UX Optimization - Text Scaling
- **Visual Readability Enhancement:**
    - [x] Increase font size of numerical values in Inventory, Customers, and Suppliers modules.
    - [x] Standardize text scaling for the rest of the application.

### Phase 7: Visual Identity Migration
- **Semantic Color System Implementation:**
    - Transitioned from hardcoded Tailwind colors to a robust semantic design system in `src/index.css`.
    - Defined tokens: `primary` (Navy Blue), `accent` (Vibrant Purple), `bg-main` (Corporate White), `surface`, `text-main`, `text-muted`, `error`, and `success`.
- **Global Visual Overhaul:**
    - Refactored all views (`Dashboard`, `Login`, `POS`, `Catalog`, `Inventory`, `Suppliers`, `Customers`) and the `Sidebar` to use the new semantic tokens.
    - Ensured high contrast and accessibility for all text elements.
    - Standardized the apearance of modals, tables, and action buttons across the entire application.

### Phase 8: Infrastructure Modernization & Inventory Split
- **View Separation:**
    - Split the old `Inventory.tsx` into two distinct views: `Products.tsx` (Product Master) and `Inventory.tsx` (Stock Balances).
    - Implemented a new Inventory view showing real-time stock balances joined with product and warehouse data.
- **UI Polishing (Inventory):**
    - Standardized numerical formats (0 decimals for stock, 2 for costs/reserved).
    - Added high-visibility styling (bold + primary color) to critical stock and unit columns.
- **Data Access Layer Migration (Stored Procedures):**
    - Fully migrated all backend SQL queries to Stored Procedures (SPs) for enhanced security and performance.
    - Implemented a comprehensive SP library covering all CRUD operations for Customers, Suppliers, Products, and Prices.
    - Created a detailed migration log in `docs/sp_migration_log.sql` for database deployment.
    - Refactored the `getNextCode` utility to use a specialized SP for correlative code generation.

### Phase 10: POS Functional Implementation & Stock Integration
- **Sale Recording Logic:**
    - Implemented full transaction flow from POS to database using `usp_Ventas_Insert`.
    - Integrated dynamic unit registration in `fact_ventas_detalle` using the specific unit code from `dim_producto_precios`.
- **Inventory Sync (Stock Deduction):**
    - Implemented intelligent stock deduction in `dim_saldos` based on the quantity type used (Planchas vs Unidades).
    - Fixed critical issue for "Huevos Pardos" to ensure stock is deducted from the correct inventory row based on the sale type.
    - Validated real-time balance updates across different warehouses.

### Phase 11: Corporate UI/UX Overhaul (Design System)
- **Typographical Modernization:**
    - Transitioned from classical Serif itallics to a bold, modern Corporate style using Montserrat.
    - Applied `font-bold` and `font-black` to all key headings and totals to increase visual impact.
- **Readability & Contrast Optimization:**
    - Implemented "High Contrast" strategy for text elements.
    - Deepened `text-muted` color palette to eliminate the "opaque" feel reported by the client.
    - Reduced reliance on low-opacity classes, substituting them with font weights and semi-transparent neutral tones for secondary information.

### Phase 12: POS Ticket UI Optimization
- **Product Area Layout:** Optimized the "Ticket Activo" detail area to maximize vertical space.
- **Independent Scrolling:** Implemented `overflow-y: auto` specifically for the product list, keeping the header and footer fixed.
- **Visual Separation:** Added subtle dividers (`border-b`) between product items to improve scanning and organization.
- **Density Adjustment:** Reduced redundant padding and gaps to increase information density without compromising font legibility.

### Phase 13: Infrastructure Dockerization & Update Automation
- **Deployment Architecture:** Implemented a hybrid model with Native SQL Server and Dockerized App layers.
- **Containerization:**
    - Created `Dockerfile.backend` for the Express server.
    - Created `Dockerfile.frontend` using a multi-stage build (Node.js build $\rightarrow$ Nginx production serve).
    - Implemented `docker-compose.yml` to orchestrate both services with automatic restarts.
- **Update System:**
    - Developed `update.bat` for one-click updates (git pull $\rightarrow$ docker rebuild).
    - Configured `host.docker.internal` for seamless container-to-host database communication.

### Phase 14: UI Responsiveness & Layout Fixes
- **Responsive Typography:** Implemented a gradual scaling system for page headers (`text-3xl` to `text-6xl`) to prevent text wrapping on laptop screens (16" and smaller).
- **Sidebar Layout Optimization:** Added `whitespace-nowrap` to navigation labels in the Sidebar to ensure menu items always remain on a single line, maintaining visual consistency across different viewport widths.

### Phase 15: Advanced POS Stock Control & Visual Highlights
- **Strict Stock Blocking:** Implemented total blocking of sales in the POS when the `stock_actual` in `dim_saldos` is insufficient, preventing negative inventory.
- **Dynamic Unit Conversion:** Developed a robust validation system (`isStockInsufficient`) that handles different inventory units (Planchas vs Unidades) by converting everything to a common base for accurate comparison.
- **Real-time POS Feedback:** 
    - Integrated high-visibility alerts in `CartItem` using red colors and pulse animations when stock is low.
    - Implemented a preventive lock on the "Realizar Pago" button when any item exceeds available stock.
### Phase 16: Client Deployment & Production Stability
- **Production Deployment:** Successfully deployed the application on the client's environment using SQL Server 2025 and Docker Desktop.
- **POS Resilience Upgrade:** 
    - Refactored `loadInitialData` in `POS.tsx` to replace `Promise.all` with independent data fetching. This prevents a single API failure from blocking the entire POS view.
    - Implemented detailed diagnostic error logging in the frontend to allow rapid identification of production API issues.
- **Critical Routing Fix:** 
    - Configured an Nginx reverse proxy in `Dockerfile.frontend` to correctly route `/api` requests to the backend container. 
    - Resolved the "Unexpected token '<'" JSON syntax error caused by Nginx returning `index.html` instead of API responses.
- **End-to-End Verification:** Confirmed stability and full functionality of Login, Master Data modules, and the POS transaction flow in the real-world client environment.

### Phase 17: POS Quantity Specification Enforcement
- **Strict Quantity Validation:** Implemented a mandatory check to ensure that every item in the POS cart has either "Planchas" or "Unidades" specified before allowing the sale to be processed.
- **Payment Button Logic:** Integrated a lock on the "Realizar Pago" button when any item in the cart is missing a quantity specification.
- **Visual Feedback:** Added high-visibility error styling (red text) to quantity inputs in `CartItem` to immediately alert the operator about missing data.
- **Safety Intercept:** Added a final validation layer in `finalizeSale` to prevent API calls if quantity specifications are missing, providing a descriptive error message.

### Phase 18: POS Precision & UX Refinement
- **Cart Item Identification:** Refactored cart logic to use `id_precio` instead of presentation name. This allows multiple lines of the same presentation (e.g., "PLANCHA") with different prices without merging them incorrectly.
- **Accumulated Stock Validation:** Updated `isStockInsufficient` to calculate the total demand of a product across all cart lines, preventing negative stock when multiple presentations of the same product are sold.
- **Input UX "Intelligent Entry":**
    - Implemented auto-selection of text on focus for quantity inputs, allowing instant typing.
    - Expanded input field widths and padding for better accessibility in the POS.
- **UI Polish:**
    - Compacted the Ticket header and observations area to maximize vertical space for the product list.
    - Restored presentation details in `CartItem` and removed the "Combined Quantities" label for better clarity.
    - Fixed duplicate quantity inputs in the UI.
- **Database Stability & Bug Fixes:**
    - **`usp_Ventas_Insert`**: Rewrote with CTEs and `RTRIM/LTRIM` to correctly aggregate stock deductions and handle `CHAR` padding issues.
    - **`usp_Utils_GetNextCode`**: Fixed document sequence sorting logic to handle numeric strings in `CHAR` columns correctly, eliminating duplicate document number errors.
    - **Documentation**: Updated `docs/pos_implementation.sql` with all current SP versions and timestamps.

### Phase 19: POS Transition to Unit-Only Stock Model
- **Inventory Model Simplification:**
    - Eliminated "Planchas" concept from the POS; transitioned entire transaction flow to a single-unit model based on `dim_producto_precios.cantidad_base`.
    - Integrated automatic unit calculation: `qty * cantidad_base` updates the units field instantly.
- **Backend & Database Alignment:**
    - Updated `usp_Ventas_Insert` to record `unidades_vendidas` in `fact_ventas_detalle`.
    - Modified stock deduction logic in `dim_saldos` to strictly deduct from the `'UNIDADES'` row, ensuring consistency with the normalized database.
- **Advanced Stock Intelligence & UX:**
    - **Enhanced Visual Feedback:** Replaced misleading "0 UNIDADES" with context-aware labels: "Seleccione Almacén" (no warehouse) and "Sin registro" (no stock record).
    - **Cumulative Validation:** Refined `isStockInsufficient` to sum total unit demand across all presentations of the same product before validating against available stock.
    - **Dynamic Payment Lock:** Implemented an intelligent "Realizar Pago" button that dynamically updates its text to inform the user of the exact blocking reason (Client, Warehouse, Stock, or Missing Units).
    - **Input Precision:** Corrected unit calculation logic to handle `0` values correctly, preventing unexpected fallbacks during manual entry.

### Phase 20: Inventory Visualization & License Control System
- **Stock View Enhancements (Mixed-Unit Visibility):**
    - Implemented a minimal switch in the "UNIDAD" column of the Inventory view.
    - Added logic to convert stock to a mixed format (Planchas and Units, 1 plancha = 30 units) for better physical count verification.
    - Created a per-product toggle state to switch between "Unidades" and "Planchas" views without affecting the database.
- **License Control System Implementation:**
    - **Database Architecture:** Defined a `licencia` table to store expiration dates and active status.
    - **Backend Security (Middleware):** Developed a server-side middleware that intercepts all API requests to validate the license status. If the license is expired or inactive, it returns a `403 Forbidden (LICENSE_EXPIRED)` response.
    - **Frontend Guard (Intercept & Block):**
        - Implemented a custom `apiFetch` wrapper that detects license expiration across the entire application.
        - Built a high-fidelity `LicenseLock` component that renders a professional full-screen lock when access is denied, matching the corporate design specifications.
        - Integrated the lock mechanism into `App.tsx` as a top-level guard.
    - **Application-wide Integration:** Refactored all views (`POS`, `Products`, `Customers`, `Suppliers`, `Inventory`, `Login`) to use the centralized `apiFetch` for unified security.

### Phase 21: Advanced Product Management & POS Fiscal Control
- **Product Price Synchronization:**
    - **Backend:** Implemented full synchronization of product prices in `PUT /api/productos/:id` (delete orphans, update existing, insert new).
    - **Backend:** Integrated price insertion in `POST /api/productos` to ensure new products are created with their respective price presentations.
    - **Frontend:** Updated the product edit modal to send the complete price list during save operations.
- **POS IGV (Tax) Control:**
    - **Functional Requirement:** Implemented the ability to toggle the IGV (18%) tax in the POS.
    - **UX/UI:** Added a dedicated "Cargar IGV" switch in the ticket configuration area, deactivated by default.
    - **Logic:** Integrated real-time total recalculation based on the tax toggle state, allowing for both tax-inclusive and tax-exclusive sales.

### Phase 22: POS Dynamic Configuration & Catalog Integration
- **Dynamic Payment Methods:**
    - **Backend:** Created a generic endpoint `GET /api/tablas/:codtabla` to retrieve configuration catalogs from the `Tablas` table.
    - **Integration:** Linked the "Tipo Pago" selector in the POS to the `Tablas` table (`n_codtabla = 5`).
    - **Ordering:** Implemented strict sorting by `n_numero` to maintain the operational order defined in the database.
    - **Flexibility:** Eliminated hardcoded payment options, allowing new methods (e.g., YAPE, Transferencia) to appear automatically upon database update.

### Phase 23: POS Payment Status Logic Optimization
- **Payment State Validation:**
    - Implemented a dynamic validation system to correctly assign the 'PAGADO' state to multiple immediate payment methods (CONTADO, YAPE, TRANSFERENCIA).
    - Fixed a bug where YAPE payments were incorrectly treated as credit sales.
    - Synchronized `monto_pagado` and `saldo` calculations to ensure financial consistency based on the selected payment method.
    - Transitioned from hardcoded ID checks to a scalable list of immediate payment methods.

### Phase 24: Dashboard Operational Insights
- **Recent Sales Implementation:**
    - Developed a specialized Stored Procedure `usp_Ventas_GetRecent` to fetch the last 5 transactions with client details.
    - Integrated a new backend endpoint `GET /api/ventas/recent` for real-time data retrieval.
    - Transformed the Dashboard "Recent Orders" section from static mock data to a dynamic table.
    - Implemented semantic state badges (PAGADO vs PENDIENTE) and professional currency/date formatting.
- **Visual Refinements:**
    - Optimized vertical spacing by reducing top padding for the sales report section.
    - Increased typographical hierarchy in the recent sales table (headers, ID, totals, and status badges) to enhance visual presence and legibility.

### Phase 25: POS Mixed Payment Distribution
- **Mixed Payment Support:**
    - Implemented the ability to handle mixed payment types in the POS.
    - Added functionality to distribute specific amounts to different payment methods (e.g., 'CONTADO' and 'YAPE') when a mixed payment is selected.
    - Implemented real-time validation to ensure the sum of distributed amounts matches the total transaction amount.
    - Updated the transaction logic to correctly record the breakdown of multiple payment methods in the database.

## 📅 Next Steps (Roadmap)
- [ ] Implement Product Categories and Lines management.
- [ ] Build the Dashboard with key metrics (Revenue, Volume, etc.).
- [ ] Implement Role-Based Access Control (RBAC) for 'Administrador' vs 'Operador'.
