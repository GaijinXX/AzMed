# Requirements Document

## Introduction

This feature adds a recent searches dropdown to the search bar that allows users to quickly access their previously searched terms. The dropdown will show the last 5 unique search terms, persist across browser sessions, and provide an intuitive way to repeat searches.

## Requirements

### Requirement 1

**User Story:** As a user, I want to see a dropdown of my recent searches when I focus on the search input, so that I can quickly repeat previous searches without retyping.

#### Acceptance Criteria

1. WHEN I focus on the search input THEN a dropdown SHALL appear showing my recent searches
2. WHEN the dropdown is visible THEN it SHALL show up to 5 recent unique search terms
3. WHEN I click on a recent search item THEN it SHALL populate the search input and trigger a search
4. WHEN there are no recent searches THEN the dropdown SHALL not appear

### Requirement 2

**User Story:** As a user, I want my recent searches to be saved across browser sessions, so that I don't lose my search history when I close and reopen the browser.

#### Acceptance Criteria

1. WHEN I perform a search THEN the search term SHALL be saved to localStorage
2. WHEN I reload the page THEN my recent searches SHALL still be available
3. WHEN I clear my browser data THEN recent searches SHALL be reset
4. WHEN a search term already exists in recent searches THEN it SHALL move to the top of the list
#
## Requirement 3

**User Story:** As a user, I want to be able to clear individual recent searches or all recent searches, so that I can manage my search history.

#### Acceptance Criteria

1. WHEN I hover over a recent search item THEN a delete button SHALL appear
2. WHEN I click the delete button THEN that specific search SHALL be removed from recent searches
3. WHEN there is a "Clear All" option THEN clicking it SHALL remove all recent searches
4. WHEN I delete a search THEN the dropdown SHALL update immediately

### Requirement 4

**User Story:** As a user, I want the recent searches dropdown to be accessible via keyboard navigation, so that I can use it without a mouse.

#### Acceptance Criteria

1. WHEN the dropdown is open THEN I SHALL be able to navigate items with arrow keys
2. WHEN I press Enter on a selected item THEN it SHALL trigger that search
3. WHEN I press Escape THEN the dropdown SHALL close
4. WHEN I tab away from the search input THEN the dropdown SHALL close

### Requirement 5

**User Story:** As a user, I want the recent searches to work with the existing multi-language support, so that searches in different languages are properly handled.

#### Acceptance Criteria

1. WHEN I search in different languages THEN all searches SHALL be saved regardless of language
2. WHEN I switch languages THEN recent searches SHALL remain available
3. WHEN displaying recent searches THEN they SHALL show in their original language
4. WHEN the interface language changes THEN the dropdown labels SHALL be translated