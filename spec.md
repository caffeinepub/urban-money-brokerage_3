# Urban Money Brokerage

## Current State
New project.

## Requested Changes (Diff)

### Add
- Full brokerage records management app
- Add New Brokerage tab with form fields: Serial Number (auto), Finance, Customer Name, MCF, Product, Gross Amount, Net Amount, Loan Amount (optional), Brokerage Amt. Received Date (optional), Bank Amt. Received Date (optional), Remark (dropdown: Received/Pending)
- All Records tab with table showing all saved brokerage entries
- Edit and Delete per record
- Filter by Remark status (Pending/Received)
- Print single record in professional format
- Print all records
- Auto-incrementing serial number

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: store brokerage records with all fields, CRUD operations, auto serial number
2. Frontend: two-tab layout (Add New Brokerage, All Records), form with validation, records table with filter/edit/delete/print
