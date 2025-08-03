# Requirements Document

## Introduction

This feature involves creating a simple, public React-based frontend interface for a database of all drugs officially available in Azerbaijan. The system will connect to an existing Supabase backend that contains comprehensive pharmaceutical data including drug registration numbers, product names, active ingredients, dosage information, packaging details, manufacturer information, and pricing data. The interface will provide search functionality and display results in a user-friendly table format, serving as a public resource for anyone who needs access to this pharmaceutical information.

## Requirements

### Requirement 1

**User Story:** As a member of the public, I want to search for drugs using a search bar, so that I can quickly find specific medications by name or active ingredient, and see all available drugs when no search is entered.

#### Acceptance Criteria

1. WHEN the application first loads THEN the system SHALL display all available drugs in the table by default
2. WHEN a user enters text in the search bar THEN the system SHALL call the Supabase function 'database-search' with the search text
3. WHEN a user clears the search bar or it becomes empty THEN the system SHALL display all available drugs again
4. WHEN the search is performed THEN the system SHALL display a loading state while the API call is in progress
5. WHEN search results are returned THEN the system SHALL display them in a table format
6. WHEN the search text matches drug names or active ingredients THEN the system SHALL return relevant results
7. IF the API call fails THEN the system SHALL display an appropriate error message

### Requirement 2

**User Story:** As a member of the public, I want to view comprehensive drug information in a table format, so that I can see all relevant details about each medication including pricing information in AZN.

#### Acceptance Criteria

1. WHEN search results are displayed THEN the system SHALL show each drug's registration number, product name, active ingredients, dosage, formulation, packaging form, amount, manufacturer, wholesale price, retail price, and date
2. WHEN displaying prices THEN the system SHALL convert the stored price values to AZN format by dividing by 100 (e.g., 5789 displays as ₼57.89, 678 displays as ₼6.78)
3. WHEN displaying prices THEN the system SHALL format them with the manat symbol (₼) and two decimal places
4. WHEN displaying active ingredients THEN the system SHALL handle long ingredient lists appropriately with proper text wrapping or truncation
5. WHEN displaying manufacturer information THEN the system SHALL show the full manufacturer name and country

### Requirement 3

**User Story:** As a member of the public, I want to see how many items are available or found, so that I can understand the scope of the results and navigate accordingly.

#### Acceptance Criteria

1. WHEN displaying all drugs on initial load THEN the system SHALL show the total count of available drugs
2. WHEN displaying search results THEN the system SHALL show the count of found items matching the search criteria
3. WHEN the count is displayed THEN the system SHALL use clear language like "Showing X items" or "Found X results"
4. WHEN pagination is active THEN the system SHALL show both the total count and the current page range (e.g., "Showing 1-25 of 150 items")
5. IF no results are found THEN the system SHALL display "0 results found" along with the no results message

### Requirement 4

**User Story:** As a member of the public, I want the search functionality to be responsive and intuitive, so that I can efficiently find the medications I'm looking for without any technical barriers.

#### Acceptance Criteria

1. WHEN a user types in the search bar THEN the system SHALL provide real-time search suggestions or debounced search
2. WHEN a user clears the search bar THEN the system SHALL clear the results table and show all items again
3. WHEN a user presses Enter in the search bar THEN the system SHALL trigger the search
4. WHEN search results are loading THEN the system SHALL show a loading indicator
5. IF no results are found THEN the system SHALL display a "no results found" message

### Requirement 5

**User Story:** As a member of the public, I want the interface to be visually appealing and accessible, so that I can easily navigate the drug database regardless of my technical background.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display a clean, professional interface with a prominent search bar and clear instructions
2. WHEN displaying the results table THEN the system SHALL use appropriate styling with clear column headers and readable fonts
3. WHEN the table contains many columns THEN the system SHALL ensure proper spacing and alignment for easy reading
4. WHEN viewing on different screen sizes THEN the system SHALL provide a responsive design that works on desktop and mobile devices
5. IF the table is empty THEN the system SHALL show an appropriate welcome message explaining how to use the database

### Requirement 6

**User Story:** As a member of the public, I want to navigate through search results using pagination with customizable page sizes, so that I can view results in manageable chunks and control how much information is displayed at once.

#### Acceptance Criteria

1. WHEN search results exceed a default number of items THEN the system SHALL display pagination controls below the table
2. WHEN pagination is displayed THEN the system SHALL show page numbers, previous/next buttons, and current page information
3. WHEN a user selects a page size option THEN the system SHALL provide dropdown options like 10, 25, 50, 100 items per page
4. WHEN a user changes the page size THEN the system SHALL update the table display and reset to the first page
5. IF there are no results or only one page of results THEN the system SHALL hide pagination controls

### Requirement 7

**User Story:** As a member of the public, I want to customize which columns are displayed in the table, so that I can focus on the information most relevant to my needs and improve readability on different screen sizes.

#### Acceptance Criteria

1. WHEN viewing the drug table THEN the system SHALL provide a column selector dropdown button with a gear icon and "Columns" label
2. WHEN clicking the column selector THEN the system SHALL display a dropdown menu showing all available columns with checkboxes
3. WHEN a column is checked in the selector THEN the system SHALL show that column in the table
4. WHEN a column is unchecked in the selector THEN the system SHALL hide that column from the table
5. WHEN the dropdown is open THEN the system SHALL show "Show All" and "Hide Optional" action buttons
6. WHEN "Show All" is clicked THEN the system SHALL make all columns visible
7. WHEN "Hide Optional" is clicked THEN the system SHALL hide all non-required columns (keeping only Registration # and Product Name)
8. WHEN the column selector button is displayed THEN the system SHALL show a count of visible columns (e.g., "5/11")
9. IF required columns exist THEN the system SHALL mark them with an asterisk (*) and prevent them from being hidden
10. WHEN the table is loading THEN the system SHALL disable the column selector to prevent conflicts

### Requirement 8

**User Story:** As a member of the public, I want the application to handle errors gracefully, so that I have a smooth experience even when technical issues occur.

#### Acceptance Criteria

1. WHEN the Supabase API is unavailable THEN the system SHALL display a user-friendly error message explaining the issue in simple terms
2. WHEN network connectivity is lost THEN the system SHALL show an appropriate offline message
3. WHEN the API returns an error THEN the system SHALL show a generic error message to the user without technical jargon
4. WHEN API calls take too long THEN the system SHALL implement appropriate timeout handling
5. IF the search function fails THEN the system SHALL allow the user to retry the search with a clear retry button