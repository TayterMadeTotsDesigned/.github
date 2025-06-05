Dooing.Task Planning & Setup

1. Overview

Dooing.Task is a productivity application that combines a task management system with an integrated Pomodoro timer. The application aims to help users maintain a structured daily workflow with customizable settings and lays the foundation for future enhancements (such as user accounts, advanced analytics, and gamified features).

2. Core Features

    A. Task Manager
        - Task CRUD Operations: 
            Create: Add tasks with a name, description, and due date
            Read: Display tasks in categorized lists (Today, Tomorrow, Future, Overdue)
            Update: Edit task details (name,description, Category,Due Date)
            Delete: Remove tasks from the list
            Completion: Mark tasks as complete

        - Task Categorization:
            Today: Tasks due on the current day (auto-assigned based on system time)
            Tomorrow: Tasks due the next day (auto-assigned based on system time)
            Future: Tasks with a due date beyond tomorrow (uses a date picker)
            Overdue: Tasks that were not completed by their due date (moves to Overdue Tasks list)

        - Auto-Date Assignment & Movement Logic:
            Dynamic Assignment: "Today" and "Tomorrow" tasks are auto-assigned based on system time
            Date Picker Validation: When a "Future" task is set, if the chosen date matches a date that is equivalent to "Today" or "Tomorrow", the system reassigns it to the proper category.
            Movement Logic: At midnight, tasks shift
                - Tomorrow -> Today: Tasks due tomorrow are moved to Today
                - Future -> Tomorrow: Future tasks whose due dates are imminent shift to "Tomorrow"
            Overdue: Tasks are moved to the Overdue list.

        - Task Limits:
            Daily Limits: Maximum of 6 tasks for "Today" and "Tomorrow"
            Weekly Limits: "Future" category is capped at 42 tasks per week.

        - Recurring Tasks:
            Daily repeating tasks are supported (e.g., "Morning Routine").

        Considerations: 
            Handle time zones, daylight savings accurately for auto-date features
            Ensure user feedback for limit enforcements and auto reassignments for usability

    B. Pomodoro Timer
        - Timer Settings
            Customization Options:
                Focus Duration: Default 25 minutes; adjustable via slider (15 to 90 mins in 5 min increments)
                Short Break Duration: Default 5 minutes; adjustable via slider (5 to 35 mins in 5 min increments)
                Long Break Duration: Default 10 minutes; adjustable via slider (10 to 45 mins)
                Sessions Per Cycle: Default 4 sessions (range 2 to 6) before a Long Break is triggered. 
        - Timer Controls:
            User Actions:
                (Start/Pause),Reset,Skip session buttons - Represented by symbols
                Option to manually complete sessions
        - Task Tracking:
            Active Timer Integration: Track tasks from the "Today" category while the timer is active.
                Pausing/Break time triggers friendly break reminders
                Users can add additional tasks (in respect to the daily limit)
            Post-session summary: On completing a full session, the system should prompt the user to either do the following
                Roll over unfinished tasks and restart the session
                Clear the task list
                Move selected tasks from "Tomorrow" to "Today" (respecting task limits)
        - Settings
            Auto start work/break sessions automatically
            set action of skip button:
                skip current session
                reset current session
                Set current session as finished
                Sound notifications        
        - Considerations:
            Ensure that the transition between sessions is seamless
            User prompts do not interrupt workflow
            Clear post-session summary
    C. Themes & Accessibility
        -Themes: Light, Dark, Elegant, and 90's themes (implement using CSS variables); users can set a default theme
        - Accessibility Options: Ensure modern accessibility standards

    D. Settings:
        - Theme Selection: Users can select and save their preferred theme.
        - Future Category Task view: Users can customize the view for the "Future" category including
            - Default view: Weekly Calendar View (starts on Sunday by default but is configurable)
            - Alternative view: Monthly Calendar View
            - Task card View are displayed in a list format based on their due date (no category icons)
    E. Notifications:
        - Task Movement: Notify users when tasks are moved between categories (e.g. "2 tasks were moved to Today")
            -Moved task card should have a highlight identifer to denote they were moved to the new category by the system
            - Sound notifications such as completed a session, ticking for when break or work phase is about to end
            - Notification window/badge for User accessibility

     F. Stretch Goals:
        - User Accounts & Authentication: Allow users to create accounts and log in
        - Sync tasks and settings across devices
        - Authentication: 2factor, email/password, social login
        - Recurring Tasks: Allow users to set tasks that repeat weekly, monthly or on custom schedules.
        - Vitural Pet: Have a little buddy to raise as you complete tasks and use the Pomodoro Timer
        - Expand the Inspo Section for future content        

                 


