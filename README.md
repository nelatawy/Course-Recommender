# Smart Advisor: Course Recommender System Documentation

## 1. Project Overview
The Smart Advisor is a university course recommendation system that combines multiple programming paradigms to provide intelligent, personalized course suggestions. The system recommends courses to students based on their academic level, completed courses, preferred subjects, and preferred difficulty.

The system follows this pipeline:
```
Mobile App → Django Backend → Prolog/AI Engine → Django Backend → Mobile App
```

It is built using four programming paradigms working together:

- **Logic Paradigm** (Prolog): the inference engine that reasons about course eligibility, prerequisites, and student preferences.
- **Functional Paradigm** (Python): a pure transformation pipeline that filters and ranks Prolog results without side effects.
- **OOP Paradigm** (Django/Python): models, strategy pattern, adapter pattern, and facade pattern for clean system design.
- **Imperative Paradigm**: the execution flow that orchestrates the full pipeline from HTTP request to JSON response.

The system has two recommendation engines that implement the same interface:
- A **Prolog-based engine** using logic programming and functional post-processing.
- A **Gemini AI-based engine** using a structured LLM prompt.

---

## 2. Data Models
Description of the core entities in the system.

### 2.1 Course
- **Attributes**: `name`, `level` (1–4), `course_department`, `difficulty` (`easy`, `medium`, `hard`, `very_hard`).
- **Relationships**: Many-to-Many self-referencing relationship for `prerequisites`.
- **Helper**: `DIFFICULTY_TO_PROLOG` maps difficulty strings to integers (0–3) for Prolog compatibility.

### 2.2 Student
- **Attributes**: `name`, `student_id`, `current_level`, `gpa`, `preferred_subjects` (JSON list of course name strings), `preferred_difficulty`.
- **Relationships**: Many-to-Many relationship with `Course` for `completed_courses`.
- **Helper**: `DIFFICULTY_TO_PROLOG` maps preferred difficulty to a Prolog integer.

### 2.3 Study Plan
- Created after every recommendation request, storing which courses were recommended and by which engine (`Prolog_Engine` or `AI_Model`).
- Many-to-Many relationship with `Course` for `recommended_courses`.
- Associated with a `Student` via a ForeignKey.
- Acts as an audit trail — every time a student requests recommendations, a new plan is saved so the history is preserved.

---

## 3. Persistence
Details on how data is stored and managed.
- **Database**: SQLite for development. The Django ORM makes it straightforward to switch to PostgreSQL for production by changing one line in `settings.py`.
- **ORM**: Django ORM handles all complex relationships (ManyToMany for prerequisites, completed courses) and database migrations.
- **Signals**: Django signals auto-populate `completed_courses` when a student is created or promoted to a higher level, adding all courses below their current level automatically. This uses `pre_save` to capture the old level and `post_save` to act on the change.
- **JSONField**: `preferred_subjects` is stored as a JSON list of course name strings directly on the Student model, avoiding a separate join table for a simple list.

---

## 4. Backend (Django)
Architecture of the web service.

### REST API
Endpoints for course management, student profiles, and recommendation triggers:

| Endpoint | Method | Description |
|---|---|---|
| `/api/recommend/prolog/<id>/` | GET | Prolog recommendations |
| `/api/recommend/ai/<id>/` | GET | AI recommendations |
| `/api/auth/signup/` | POST | Student registration |
| `/api/auth/signin/` | POST | Student login |
| `/api/auth/admin/` | POST | Admin authentication |
| `/api/courses/` | GET/POST | List or create courses |
| `/api/courses/<id>/` | GET/PUT/DELETE | Course detail |
| `/api/prerequisites/` | GET | List all prerequisite edges |
| `/api/prerequisites/add/` | POST | Add prerequisite edge |
| `/api/prerequisites/remove/` | POST | Remove prerequisite edge |
| `/api/students/<id>/completed_courses/` | POST | Toggle completed course |
| `/api/students/<id>/preferred_courses/` | POST | Toggle preferred subject |
| `/api/students/<id>/preferred_difficulty/` | POST | Update difficulty preference |

### Middleware
- **CORS**: custom `CorsMiddleware` allows the React Native mobile app to communicate with the Django API across origins.
- **Authentication**: admin-only endpoints require an `X-Admin-Key` header matching `ADMIN_SECRET_KEY` in settings.

### Strategy Pattern
Both recommendation engines implement the same abstract interface:

```python
class MasterAdvisorStrategy(ABC):
    @abstractmethod
    def generate_plan(self, student, all_courses) -> list[str]:
        pass
```

This means Django views never need to know which engine they're calling — swapping Prolog for AI (or vice versa) requires zero changes to the view layer.

### Prolog-Django Bridge (Person 3)
The bridge between Django and Prolog is implemented in `architecture.py` using three design patterns working together:

- **Context Manager** (`PrologAdapter`): manages the Prolog engine lifecycle using Python's `with` statement, ensuring the singleton instance is initialized once and cleaned up properly.
- **Strategy Pattern** (`RankingStrategy` / `FunctionalRanking`): the functional transformation layer is pluggable — any number of ranking strategies can be chained after the Prolog query.
- **Facade Pattern** (`HybridPrologEngine`): wraps the Prolog bridge and functional pipeline behind the same `generate_plan()` interface as the AI engine, so Django views never need to know which engine they're calling.

### Paradigm Division Across the Team

| Paradigm | Where | Who |
|---|---|---|
| **Logic** | `recommendation-engine.pl` — all inference rules | Person 1 |
| **OOP** | Django models, strategy/adapter/facade patterns | Person 2 |
| **Prolog Bridge + Functional** | `architecture.py` — pyswip integration, functional pipeline | Person 3 |
| **AI/External API** | `ai_engine_adapter_strategy.py` — Gemini integration | Person 4 |
| **Imperative** | `views.py`, `api_views.py` — request/response execution flow | Person 2 |

Each paradigm was chosen because it naturally fits its domain:
- **Logic** fits reasoning about rules and constraints — Prolog's backtracking handles combinatorial course matching elegantly.
- **Functional** fits data transformation — pure functions are predictable, testable, and composable.
- **OOP** fits system design — models, strategies, and adapters organize complexity into clear responsibilities.
- **Imperative** fits execution flow — sequential steps (validate → query → transform → respond) are naturally expressed as procedures.

---

## 5. Prolog Engine
The logic-based recommendation core.

### Integration
Django communicates with Prolog via `pyswip`, a Python library that embeds SWI-Prolog as a shared library inside the Python process.

#### Singleton Engine
Because `pyswip` only supports one Prolog engine per process, `PrologAdapter` uses a class-level singleton:

```python
class PrologAdapter(LogicEngineInterface):
    _instance = None

    def __enter__(self):
        if PrologAdapter._instance is None:
            PrologAdapter._instance = Prolog()
            PrologAdapter._instance.consult("recommendation-engine.pl")
        self.prolog_thread = PrologAdapter._instance
        return self
```

The `.pl` file is loaded once via `consult()`. On every subsequent request the same engine instance is reused.

> **Why singleton?** `pyswip` raises a `PrologError: Unable to attach new Prolog engine to the thread` if you try to create a second `Prolog()` instance in the same process. Django's dev server keeps the process alive between requests, so without the singleton every request after the first would crash.

#### Knowledge Base Construction
Before every query the knowledge base is wiped via `retractall` and rebuilt fresh from Django's database. This prevents stale facts from a previous request contaminating the current one:

```python
def _retract(self):
    self.prolog_thread.retractall("courses(_)")
    self.prolog_thread.retractall("prereq(_, _)")
    self.prolog_thread.retractall("taken(_)")
    self.prolog_thread.retractall("difficulty(_, _)")
    self.prolog_thread.retractall("level(_, _)")
    self.prolog_thread.retractall("student_level(_)")
    self.prolog_thread.retractall("student_pref_diff(_)")
    self.prolog_thread.retractall("preferred(_)")
```

The following facts are then asserted from Django ORM data:

| Prolog Fact | Source |
|---|---|
| `courses([...])` | All `Course` objects |
| `prereq(A, B)` | `course.prerequisites.all()` |
| `difficulty(Course, N)` | `Course.DIFFICULTY_TO_PROLOG[course.difficulty]` |
| `level(Course, N)` | `course.level` |
| `student_level(N)` | `student.current_level` |
| `student_pref_diff(N)` | `Student.DIFFICULTY_TO_PROLOG[student.preferred_difficulty]` |
| `taken(Course)` | `student.completed_courses.all()` |
| `preferred(Subject)` | `student.preferred_subjects` |

All course names are normalized to **lowercase** before asserting to ensure consistent matching with Prolog's case-sensitive atom comparison.

> **Case sensitivity challenge**: Prolog atoms are case-sensitive, but Django stores course names with original casing (e.g. `"CS101"`). Early in development, `preferred('Calculus')` would not match `in_group('calculus', 'calculus')` because of the capital C. The fix was to normalize all course names and preferences to lowercase both when asserting facts and when fetching results back from Django (`name__iexact`).

#### Querying and Result Processing
After asserting all facts, the bridge queries `recommend(Course, Level)`. pyswip returns a list of dictionaries:

```python
results = list(self.prolog_thread.query("recommend(Course, Level)"))
# [{'Course': 'db', 'Level': 4}, {'Course': 'networks', 'Level': 2}, ...]
```

Prolog naturally returns results in priority order (Level 4 → 1) through backtracking. Course names are then mapped back to Django `Course` objects using case-insensitive lookup (`name__iexact`) and the original Prolog order is preserved via:

```python
sorted(recommended_courses, key=lambda course: course_names.index(course.name.lower()))
```

#### Functional Pipeline
After Prolog returns its ordered results, they pass through `FunctionalRanking.apply()` — a pure functional transformation that removes duplicates while preserving Prolog's priority order:

```python
def apply(self, courses, student):
    seen = set()
    unique_courses = []
    for course in courses:
        if course.name not in seen:
            unique_courses.append(course)
            seen.add(course.name)
    return unique_courses
```

This demonstrates the functional paradigm — data flows in, transformed data flows out, with no side effects or shared state. Additional ranking strategies can be plugged in by adding more `RankingStrategy` implementations to the `HybridPrologEngine` strategies list.

#### Cycle Detection
`load_course_and_validate` runs `topo_sort(X)` after asserting course data. If the query returns an empty list (Prolog returned `false`), a `CurriculumCycleError` is raised and Django returns a 400 response to the client.

---

### Logic Rules

#### Dependency Validation (Topological Sort)
Performs a DFS scan to detect cycles and reverses the order to get the topologically sorted result:

```prolog
topo_sort(Ordered) :- 
    courses(Courses),
    foldl(dfs([]), Courses, [], ReverseOrdered),
    my_reverse(ReverseOrdered, Ordered).
```

`foldl` is used to chain the visited array across recursive calls, giving a global visited set:

```prolog
dfs(_, Node, Visited, Visited) :-
    member(Node, Visited), !.
```

The first `dfs` clause is the base case — if the node is already visited, the cut `!` stops re-checking it. Otherwise it falls through to the second clause:

```prolog
dfs(Stack, Node, PrevVisited, [Node | NewVisited]):-
    \+member(Node, Stack),
    findall(Dependee, prereq(Dependee, Node), AllDependees),
    foldl(dfs([Node|Stack]), AllDependees, PrevVisited, NewVisited).
```

The second clause checks if the node is on the current DFS stack (cycle detection). If it is, the predicate fails and `topo_sort` returns false — signaling a broken curriculum to the backend. Otherwise it recurses into all dependees.

---

#### Eligibility Rules
A course is eligible if the student's level is greater than or equal to the course's level, all prerequisites are satisfied, and the course has not already been taken:

```prolog
can_take(Course) :-
    courses(Courses),
    member(Course, Courses),
    prereqs_satisfied(Course),
    eligible(Course),
    \+taken(Course).
```

---

#### Recommendation Levels
`recommend/2` returns courses with a priority level (1–4). This serves two purposes:
1. **Ordered recommendations**: Prolog backtracks through clauses 4→3→2→1, naturally returning the best matches first.
2. **Filtered queries**: a specific level can be requested to get only courses of that priority.

```prolog
recommend(Course, 4):-
    can_take(Course),
    suitable_diff(Course),
    in_group(Course, Group),
    preferred(Group).

recommend(Course, 3):-
    can_take(Course),
    \+suitable_diff(Course),
    in_group(Course, Group),
    preferred(Group).

recommend(Course, 2):-
    can_take(Course),
    suitable_diff(Course),
    in_group(Course, Group),
    \+preferred(Group).

recommend(Course, 1):-
    can_take(Course),
    \+suitable_diff(Course),
    in_group(Course, Group),
    \+preferred(Group).
```

**Note**: The knowledge base must be constructed in the user thread or in a separate engine instance for the queries to work, as Prolog does not read from CSV or the SQL database directly.

---

## 6. GenAI Integration
The AI-driven recommendation layer, implemented as `AIEngineAdapter` which implements the same `MasterAdvisorStrategy` interface as the Prolog engine, allowing the backend to swap between the two advisors without changing any endpoint logic — the caller only sees `generate_plan(student, all_courses)`.

- **SDK**: `google-genai` using `gemini-2.5-flash`, chosen for its speed and strong instruction-following on structured output tasks. The API key is injected via Django settings and never hardcoded.

- **Context Building**: Before constructing any prompt, the student's data is pulled from the Django ORM and assembled into a plain dictionary. The most important step here is pre-computing two boolean flags per course **in Python** before sending them to Gemini:
    - `is_preferred`: whether the course name is in the student's preferred subjects list.
    - `difficulty_matches`: whether the course difficulty matches the student's preferred difficulty.

- **Prompt Engineering**: The prompt is structured in three parts:
    1. **Student Profile**: the student's name, current level, completed courses, preferred subjects, and preferred difficulty are injected at the top to give Gemini full context before any instructions.
    2. **Task Instructions**: Gemini is given a numbered list of explicit steps to follow — first filter only eligible courses (level ≤ student level AND all prerequisites in completed list), then assign each eligible course a tier based solely on the two precomputed flags, and finally sort the output PLATINUM → GOLD → SILVER → BRONZE. The prompt explicitly states:
       > *"Use ONLY the `is_preferred` and `difficulty_matches` flags for tiering. Do NOT re-evaluate or override them based on course names."*
       This instruction is critical to prevent Gemini from ignoring the flags and falling back to its own semantic judgment about what a "preferred" course looks like.
    3. **Available Courses JSON**: the full list of available courses is appended at the end as a formatted JSON block, each entry containing name, level, difficulty, prerequisites, and the two precomputed flags. Putting the data after the instructions ensures Gemini reads the rules before processing the courses.

- **Tier System**: Gemini is instructed to rank eligible courses using the same 4-tier priority as the Prolog `recommend/2` predicate:

    | Tier     | `is_preferred` | `difficulty_matches` |
    |----------|---------------|----------------------|
    | PLATINUM |  true        |  true               |
    | GOLD     |  true        |  false              |
    | SILVER   |  false       |  true               |
    | BRONZE   |  false       |  false              |

- **JSON Parsing**: Gemini is prompted to respond only with a JSON array of course name strings with no markdown or extra text. A defensive stripping step removes any code fences before parsing, and all returned course names are validated against the actual database to prevent hallucinated entries slipping into the final response. The final tier sorting is also re-applied deterministically in Python as a safety net, regardless of the order Gemini returns.

---

## 7. React Frontend (Mobile App)
The user interface built with React Native / Expo.

### Navigation
- **Stack Navigator** (`RootNavigator`): handles the Auth → Main transition based on login state.
- **Bottom Tab Navigator** (`MainTabNavigator`): shows different tabs depending on role — students see Course Catalog + Advisor, admins see only the Dashboard.

### State Management
Global state is managed via React Context + `useReducer` (`CourseContext.tsx`). The state shape includes:
- `courses` and `edges` — the full curriculum loaded from the backend.
- `currentStudent` — the logged-in student with their completed and preferred courses.
- `role` — `'student'`, `'admin'`, or `null` (not logged in).
- `adminKey` — stored in state for admin API calls requiring `X-Admin-Key`.

All backend communication is centralized in `api.ts`, which provides typed async functions for every endpoint.

### Components

- **`CourseTable`**: displays all courses with level/difficulty badges, checkboxes for marking courses as taken (synced to backend), and a star toggle for preferred subjects (admin view shows edit/delete controls).
- **`PrerequisiteGraph`**: interactive SVG graph with draggable nodes (gesture-based, clamped to container bounds) and animated bezier-curve prerequisite edges drawn with `react-native-svg`.
- **`AddCourseModal`**: slide-up sheet for creating or editing a course — captures name, level (1–4 selector), and difficulty.
- **`AddEdgeModal`**: slide-up sheet with two dropdown pickers for selecting prerequisite → dependent course pairs, with self-loop prevention.
- **`AdvisorScreen`**: difficulty preference selector (animated sliding indicator) and AI recommendation display with a "Regenerate" option.
- **`AdminDashboardScreen`**: full curriculum management — course table and prerequisite graph in edit mode.
- **`AuthScreen`**: student sign-in/sign-up and admin key login with tab switching.

### Known Limitations
- The "Recommend Next" tab in `AdvisorScreen` is currently not wired to the Prolog endpoint — it shows a placeholder. The AI recommendations endpoint is fully integrated.
- `preferred_subjects` is stored as course name strings on the backend but the mobile app toggles them by course ID — the `toggle_preferred_subject` endpoint resolves the ID to a name before storing, ensuring Prolog always receives names.

---

## 8. Reflection
If we were building a real production AI advising system, we would choose a **hybrid approach** combining both paradigms used in this project:

- **Prolog for hard constraints**: prerequisites, level eligibility, and cycle detection are deterministic rules that must always be enforced correctly. Logic programming excels here because the rules are declarative, auditable, and provably correct. A student should never be recommended a course they cannot take — this is a hard constraint that must never be violated, and Prolog guarantees it.

- **LLM for soft preferences**: a real student's preferences are nuanced and hard to encode as rigid rules. An LLM can reason about a student's goals, career interests, and learning style in a way that a hand-coded rule system cannot. The Gemini integration in this project demonstrates this — by pre-computing preference flags in Python and passing them to Gemini, we get the best of both worlds: deterministic constraint enforcement and flexible preference reasoning.

- **Functional pipeline for transparency**: pure transformation functions between the inference layer and the API make the system testable and debuggable — critical for a system that affects student academic progress.

### Challenges Faced

- **pyswip singleton**: `pyswip` raises an error if a second `Prolog()` instance is created in the same process. Django's development server keeps the process alive between requests, so the second request would always crash. This required implementing a class-level singleton and a `retractall` cleanup step before each query.

- **Case sensitivity**: Prolog atoms are case-sensitive but Django stores course names with original casing. `preferred('Calculus')` would silently fail to match `in_group('calculus', 'calculus')`. The fix was to normalize everything to lowercase at the assertion boundary and use `name__iexact` when mapping results back to Django objects.

- **Preserving Prolog's order**: Django's `filter(name__in=[...])` does not preserve the order of the input list. Since Prolog returns courses in priority order (Level 4 first), losing this order meant losing the ranking. The fix was to sort the Django queryset results back into Prolog's original order using `course_names.index(course.name.lower())`.

- **preferred_subjects ID vs name mismatch**: the mobile app sends course IDs when starring a course, but Prolog needs course names for `preferred/1` matching. The `toggle_preferred_subject` endpoint resolves IDs to lowercase names before storing, and `_student_to_dict` filters out any legacy numeric strings to ensure Prolog only ever receives names.

### What We Would Add in a Real System

- A dedicated `PreferredSubject` model instead of a JSONField, allowing richer preference data (weight, timestamp, reason).
- Multi-dimensional Prolog groups (by topic and by department) for more precise preference matching.
- Course difficulty adaptation based on GPA — students with lower GPAs could be steered toward easier courses automatically.
- A feedback loop where students rate recommendations, feeding back into the preference model.
