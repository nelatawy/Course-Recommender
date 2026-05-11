# UI Creation Implementation Plan

## 1. Stack
- **React Native + Expo Framework** to remove the stress of not having an android studio/xcode installed on the system and help with the native configuration.
- **Typescript** for type safety.
- **Nativewind CSS** for Talwind-like styling.
- **Libraries**: 
    - **React Navigation** for navigation.
    - **React Native Reusables and GlueStack** for UI components.
    - **Expo Google Fonts** for custom fonts.

## 2. Requirements
- You are required to make a college course recommender app that is minimalistic and elegant, it should contain the following features:
    - **Dark mode**: The app should have a dark mode with a premium feel. with a midnight color theme and a techy professional feeling.
    - **Onboarding/Splash screen**: This screen will contain the app name and a tagline for the app.
    - **No login screen** the app should be guest-like with session based storage for user data.

    - **Course Setup Page**:
        - **A Table to Add Courses**: with a plus sign to add a new course, a trash can to delete a course.
    
        - **A Dependency Graph** that the user can edit to change the wiring of the courses' prerequsites,
        it should be minimalistic, with a clean button to add dependency edge with a note above saying that an edge means that the from is a prerequisite of the to, and when a node is clicked it shows the edit node modal that contains the name of the course and a trash can to delete it, make it draggable using react-native-graph.

        - **Course Grouping**: you can add a group and add courses to individual groups, the courses can belong to a group and can not belong to a group, a course can belong to multiple groups and a group can contain multiple courses. 

        - **Mark Courses as Taken**: a check mark for each course to set it as taken.

    - **Advisor Page**: this page will contain the course recommender system
    
        - **Two main modes**:  (Must be disabled if one or more of the needed settings are missing and can only pick one mode at a time)
        
            - **Suggested Order**: the user can get a suggested order of courses to take based on the prerequsites of all courses but it requires that the user first adds all the courses and their prerequisites.

            - **Recommend the Next Course**: the user can get a recommendation based on his preferred group of subjects, the courses that he/she already took, and again the prerequisites of the courses.
        - **AI Mode**: There should be an AI button that has the Gemini Logo that should change the mode of the request to use the Gemini API to get the course recommendations, and shows it in a different result bar highlighted (AI Suggested Course)

        
## 4. Data Models
    leave it for now since its all mock data and we havent yet figured out the backend

## 3. Styling

- **Apple Style Minimalistic** : Strategy 
    - **Color Palette**: Midnight Black, Deep Navy, Soft Gray, Muted White, and bright accent colors that pop (to give the app a professional and techy look and feel).
    - **Typography**: Clean, sans-serif fonts use Helvetica or similar fonts + SF Pro fonts.
    - **Components**: Rounded corners for all elements (cards, buttons, inputs), subtle soft shadows, and smooth transitions, and animations.
- **Use Icons**: from lucide-react-native to give the app a professional and techy look and feel.
- **Use animations**: Lottie for smooth animations, this will give the app a premium and techy look and feel.

## 4. Notes
- **The UI should be well-organized and easy to navigate**. This means that the user should be able to find the information they need quickly and easily.
- **The UI should be visually appealing and engaging**. This means that the user should enjoy using the app and want to continue using it.
- **The UI should be simple and intuitive to use**. This means that the user should be able to understand how to use the app without having to read a manual.
- **The UI should be fast and responsive**. This means that the user should not have to wait long for the app to load or for the app to respond to their input.
- **The UI should use modern design trends** and should be visually appealing to the target audience.

- **Put in mind the Wiring with the Backend**: Backend is in the `smart_advisor` directory, only tthe base but it will be using Django server with python and supports the Genai Mode of operation and a Prolog based recommender so you should leave decent TODOs wherever wiring is needed and make the services that will send the requests to the backend split into two main services 1 for the LLM part and 1 for the logic part.

- **Minimize the Usage of Magic Values**: use constants and variables to store values like api endpoints, colors, etc.

- **Follow Clean Architecture Principles**: Separate UI logic from business logic, use dependency injection, etc.

- **Clean Comments (When Needed)** : And make them elaborate and professional (No use of emojis is allowed whatsoever !).

