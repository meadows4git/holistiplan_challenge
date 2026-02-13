## Time
**Estimated Time Spent:**
6.25hrs

## AI
[✔️] - Did you use AI tooling during the completion of your work?
  `AI Assistance and how I used it:`
    - GitHub Copilot (AI assistant for code generation and refactoring)
    - Used for Code generation, refactoring assistance (e.g., moving logic from component to Pinia store), bug fixes. 
    (auto-refresh initialization, live timestamp updates, filters/sorting, and bulk updates)

**Details**
What tooling did you use?:
Please provide a brief description of how you used it:
  `Development Environment:`
    - VS Code - All coding and AI interactions
    - PowerShell terminal - Used to run backend and UI in seperate windows to better debug issues
    - Git - Using GitLens within VS Code for version control
    - AI - explained above


## Application Notes
  - Dashboard table was only showing CPU usage, not memory or disk usage despite data being available
  - Could use some ADA accessibility updates, I did not spend a lot of time here, but contrast for colors is the first thing that caught my eye on this.
  - If I had more time, I would work on layout of some of the features added, but it works.

**Observed Bugs**
  - CPU usage in backend appears to be stored as decimal (0-1) but displayed inconsistently (sometimes as %, sometimes as decimal) - Normalized backend decimal values (0-1) to percentage (0-100) within the Pinia store to ensure UI consistency.
  - Site is not mobile friendly, left nav is biggest issue, a start of a "simple" fix would be a hamburger menu.

**Other Insights**
  - The application has good separation of concerns with Pinia store handling state management
  - Charts update reactively when data changes
  - Dark mode support is implemented throughout
  - Componentized servers table for reusability between Dashboard and Servers views

**Refactoring & Code Quality**
  - Created reusable ServersTable component to eliminate code duplication between DashboardView and ServersView
  - Component accepts props for:
    - `maxRows`: Optional row limit for display
    - `showActions`: Toggle for Edit/Delete buttons
    - `showSorting`: Toggle for sortable column headers  
    - `title`: Optional table title
  - Emits `edit` and `delete` events for parent components to handle actions
  - Uses slots for custom footer content (e.g., "View all servers" link)

## Task Notes

### FE-003: Dashboard Interactivity - COMPLETED

  After looking over the different tasks, I plan to start with task "FE-003: Dashboard Interactivity". Normally I would reach out to internal stakeholders to get the exact "pertinent" information the "users" would like to see, but in the interest of time and this challenge, I'll make some assumptions. Namely, I will display all the data that is already coming back from the DB, that we are displaying on the Server view, but not on the Dashboard view. I'm starting with this task first because I see that there are a couple of other tasks that will benefit from the work done on this task.

  **Implemented Features:**

  1. **Manual Refresh Button**
    - Added refresh button with loading state indicator (animated spinner)
    - Fetches both servers and dashboard stats simultaneously using Promise.all

  2. **Last Updated Timestamp**
    - Displays relative time (e.g., "30s ago", "2m ago")
    - interval counter
    - Updates on each refresh
    - Shows "Last upated: 0s ago" on first load

  3. **Auto-Refresh Toggle**
    - Toggle switch to enable/disable auto-refresh
    - Configurable intervals: 15s, 30s, 60s, 2m
    - Properly cleans up intervals on component unmount to prevent memory leaks
    - Interval selector only shown when auto-refresh is enabled

  4. **Dashboard Filters**
    - Status filter (All, Online, Offline, Maintenance, Error)
    - Location filter (dynamically populated from available server locations)
    - Clear filters button (only shown when filters are active)
    - Filter summary showing "X of Y servers"
    - Filters update all dashboard components:
      - Stat cards
      - Charts (status distribution and average usage)
      - Server table

  5. **Enhanced Data Display**
    - Added Memory and Disk columns to the server table
    - Fixed CPU usage display to properly convert decimal to percentage
    - Changed table header from "Recent Servers" to "Filtered Servers" when filters are active

  **Technical Decisions:**

  - Used computed properties for filtered data to maintain reactivity
  - Calculated filtered averages client-side rather than adding new backend endpoints
  - Filters are scoped to dashboard only (not persisted or shared across views)
  - Auto-refresh uses setInterval and properly cleans up on component unmount
  - Filtered stats are computed from the full server list for accuracy

  **User Experience Improvements:**

  - Users can now see up-to-date data without page reload
  - Filters help focus on specific server subsets
  - Auto-refresh provides "live dashboard" feel for monitoring
  - More complete resource usage data (CPU, Memory, Disk) visible at a glance
  - Clear visual feedback for loading states and active filters

### FE-002: Filtering and Sorting - COMPLETED

  Implemented comprehensive filtering and sorting capabilities for the Servers list view to help users manage large numbers of servers effectively.

  **Implemented Features:**

  1. **Filtering**
    - **Free text search** by server name (case-insensitive)
    - **IP address search** (simple string matching)
    - **Status filter** (Online, Offline, Maintenance, Error)
    - **Location filter** (dynamically populated from available locations)
    - Clear filters button (shown when any filter is active)
    - Filter summary showing "X of Y servers"

  2. **Sorting**
    - **Clickable column headers** for Name, Status, Location, and Uptime
    - **Visual sort indicators** (↑ for ascending, ↓ for descending, ↕️ for unsorted)
    - **Three-state sorting**: 
      - First click: ascending
      - Second click: descending  
      - Third click: clears sort (returns to default order)
    - Hover effect on sortable headers for better discoverability

  **Technical Decisions:**

  - Centralized filtering and sorting logic in the Pinia store for reusability
  - All filters work together (additive filtering)
  - Sorting is applied after filtering
  - Case-insensitive string comparisons for consistent sorting
  - Store exposes `sortConfig` and `setSortField()` for component use
  - Filters are scoped to the Servers list view (separate from dashboard filters)

  **User Experience Improvements:**

  - Users can quickly find specific servers by name or IP address
  - Multiple filters can be combined for precise server selection
  - Sorting helps organize large server lists
  - Clear visual feedback for active filters and sort direction
  - Responsive filter layout adapts to screen size
  - More complete resource usage data (CPU, Memory, Disk) visible at a glance
  - Clear visual feedback for loading states and active filters

### FE-001: Server Health Monitoring - COMPLETED

  Implemented a comprehensive health score system that gives users an at-a-glance view of server health based on resource utilization.

  **Implemented Features:**

  1. **Health Score Calculation**
    - Weighted formula combining CPU (40%), Memory (40%), and Disk (20%) usage
    - Score range: 0-100 (higher is better)
    - Formula: `(100 - CPU%) * 0.40 + (100 - Memory%) * 0.40 + (100 - Disk%) * 0.20`
    - Handles missing/invalid data gracefully (defaults to 0 if unavailable)
    - Clamps values to 0-100 range to prevent edge case issues

  2. **Dashboard Integration**
    - New "Average Health" stat card in dashboard header
    - Displayed alongside Total Servers, Online, Offline, etc.
    - Color-coded: Green (≥70), Yellow (40-69), Red (<40)
    - Updates reactively with filters and auto-refresh

  3. **Server Table Health Column**
    - Added "Health" column to all server tables (Dashboard and Servers views)
    - Displays both numeric score and visual progress bar
    - Progress bar color matches health ranges (green/yellow/red)
    - Positioned between Usage and Uptime columns for logical flow

  4. **Color Coding System**
    - **Green** (70-100): Healthy server with low resource utilization
    - **Yellow** (40-69): Warning state, server under moderate load
    - **Red** (0-39): Critical state, server heavily loaded or at capacity
    - Consistent color scheme used across dashboard stat and table cells

  **Technical Decisions:**

  - Health calculation logic centralized in Pinia store (`calculateHealthScore` function)
  - Created `serversWithHealth` computed property that adds health scores to each server
  - Created `averageHealthScore` computed property for dashboard stat
  - Modified `filteredServers` to use `serversWithHealth` so health scores automatically flow to all components
  - Inverted formula (100 - usage%) so lower resource usage = higher health score
  - Weighted CPU and Memory equally (40% each) as most critical resources
  - Disk usage weighted lower (20%) as it's typically a slower-changing metric
  - Edge case handling uses typeof checks to verify data before calculations

  **User Experience Improvements:**

  - Quick visual assessment of server health without analyzing individual metrics
  - Dashboard average health provides fleet-wide health overview
  - Color coding enables rapid identification of problematic servers
  - Progress bars provide intuitive visual representation alongside numeric scores
  - Health scores work seamlessly with existing filters and sorting

  **Architecture Notes:**

  - Store exports: `serversWithHealth`, `averageHealthScore`, `calculateHealthScore`
  - Health component added to ServersTable.vue (used by both Dashboard and Servers views)
  - getHealthColor() helper function for consistent color application
  - Minimal performance impact: health scores computed once per data fetch

### FE-004: Bulk Operations - COMPLETED

  Implemented bulk operations to allow users to efficiently manage multiple servers simultaneously, reducing repetitive actions and improving workflow efficiency.

  **Implemented Features:**

  1. **Checkbox Selection System**
    - Checkboxes added to each row in the Servers table
    - "Select All" checkbox in table header
    - Visual feedback for selected rows
    - Selection persists during filtering and sorting
    - Clear selection count displayed when servers are selected

  2. **Bulk Operations Toolbar**
    - Appears when one or more servers are selected
    - Shows count of selected servers
    - "Clear selection" link for quick deselection
    - Action buttons: Update Status and Delete
    - Styled with blue background to stand out from normal UI

  3. **Bulk Delete**
    - Delete multiple servers with single action
    - Confirmation modal with warning icon
    - Shows count of servers to be deleted
    - Cannot be undone warning
    - Loading state during deletion ("Deleting...")
    - Backend endpoint: POST `/api/servers/bulk/delete`

  4. **Bulk Status Update**
    - Update status for multiple servers simultaneously
    - Modal with dropdown to select new status (Online, Offline, Maintenance, Error)
    - Shows count of servers to be updated
    - Prevents submission without status selection
    - Loading state during update ("Updating...")
    - Backend endpoint: POST `/api/servers/bulk/update-status`

  **Technical Decisions:**

  - Selection state managed in Pinia store (`selectedServerIds` as Set for O(1) lookup)
  - Store functions: `toggleServerSelection`, `toggleAllServers`, `clearSelection`, `bulkDeleteServers`, `bulkUpdateStatus`
  - Backend uses transactional operations to ensure consistency
  - Backend returns count of affected servers
  - Frontend optimistically updates UI after successful API call
  - Selection cleared automatically after bulk operations complete
  - Bulk selection only shown on Servers view (not Dashboard) via `showBulkSelection` prop

  **User Experience Improvements:**

  - Dramatically reduces time to manage multiple servers
  - Clear visual feedback for selection state
  - Confirmation dialogs prevent accidental bulk actions
  - Loading states keep users informed during operations
  - Toolbar disappears automatically when no servers selected
  - Color-coded action buttons (blue for update, red for delete)

  **Safety Measures:**

  - Confirmation modal for bulk delete with warning icon and emphasis
  - Status dropdown validation (cannot submit without selection)
  - "Cannot be undone" warning for delete operations
  - Button disabled states during loading prevent double-submission
  - Backend validates all inputs and returns error if invalid

  **Architecture Notes:**

  - Backend endpoints follow RESTful conventions with `/bulk/` namespace
  - Frontend API methods: `serversAPI.bulkDelete()`, `serversAPI.bulkUpdateStatus()`
  - Store maintains single source of truth for selection state
  - ServersTable component enhanced with `showBulkSelection` prop
  - Modals use consistent styling with other confirmation dialogs

### Task FE-005: Error Handling and User Feedback - NOT COMPLETED

  **Why it was not completed:**
  - The current focus was on delivering FE-001 to FE-004 features and refactoring for maintainability
  - With the store and UI now structured, FE-005 can be added cleanly without large refactors

  **Planned Implementation Notes (what I would do next):**

  1. **Global Notification System**
    - Add a lightweight toast/alert system (Pinia or a small component) for success, warning, and error messages
    - Standardize on message patterns for create/update/delete and bulk actions

  2. **Form-Level Validation and Errors**
    - Show inline validation errors for required fields and server-side validation failures
    - Surface API errors in context (e.g., near Save/Delete buttons) with human-readable messages

  3. **Loading and Disabled States**
    - Add loading spinners to primary actions (create/update/delete, bulk operations)
    - Disable inputs and buttons while requests are in-flight to prevent duplicate submissions

  4. **Use Existing handleEditSaved Hook**
    - Use `handleEditSaved` in ServersView to trigger a success toast (e.g., "Server updated")
    - If the API returns validation errors, display them in the edit modal and keep it open

  5. **Error Boundary Patterns**
    - Add a simple error banner component for API failures at the page level (e.g., failed server fetch)
    - Use consistent messaging from the store `error` state so the UI never fails silently

  6. **Success Feedback for Bulk Operations**
    - Show counts in toasts (e.g., "5 servers updated") after bulk status updates
    - Show confirmation in delete flows beyond modal close (e.g., a brief success toast)
