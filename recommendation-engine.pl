:- use_module(library(csv)).
:- use_module(library(apply)).


:- dynamic courses/1.
:- dynamic prereq/2.
:- dynamic taken/1.
:- dynamic difficulty/2.
:- dynamic level/2.
:- dynamic student_level/1.
:- dynamic student_pref_diff/1.
:- dynamic preferred/1.
:- dynamic in_group/2.


% the using server should assert the courses list data
% assert(courses(.. the list ...)) but make sure it's thread local

% same thing goes for Prerequisites 
% assert(prereq(dependee, dependent))

% all_courses(['Math', 'Physics'])


% --- TEST ----

% All courses in the system
% courses(['Intro', 'Calculus', 'CS101', 'Algorithms', 'AI']).

% prereq(Prerequisite, Course)
% Interpretation: The first argument is the "Dependee" (must come before).

% prereq('Intro', 'Calculus').
% prereq('Intro', 'CS101').
% prereq('CS101', 'Algorithms').
% prereq('Calculus', 'AI').
% prereq('Algorithms', 'AI').

% ---- To Test Cycles ----
% prereq('AI', 'Intro').



% Useful to generate some order to take the courses so that a course is taken after all it's dependencies
% and if it's impossible returns false
topo_sort(Ordered) :- 
    courses(Courses),
    foldl(dfs([]), Courses, [], ReverseOrdered),
    my_reverse(ReverseOrdered, Ordered).

dfs(_, Node, Visited, Visited) :-
    member(Node, Visited), !.
    % if the node is a member of the visited nodes , exit '!'(cut)
    % else the member predicate will fail and it'll try the second clause that aonly checks the stack for cycles

dfs(Stack, Node, PrevVisited, [Node | NewVisited]):-
    \+member(Node, Stack), % to prevent cycles,
    findall(Dependee, prereq(Dependee, Node), AllDependees),
    foldl(dfs([Node|Stack]), AllDependees, PrevVisited, NewVisited).


my_reverse(List, Reversed) :-
    rev_helper(List, [], Reversed).

rev_helper([], Acc, Acc).

rev_helper([H|T], Acc, Result) :-
    rev_helper(T, [H|Acc], Result).

% Recommending based on info
% we need to first assign courses to categories
% and by default every course is in the group defined by itself (idempotency)
in_group(X,X).

% assert(in_group(Course, Group))

% and then add then assert the taken courses
% assert(taken(Course))

% and also assert the preferred groups/courses
% assert(preferred(Group)) or assert(preferred(Group))

% we need to assert difficulty number 1-3
% we should also assert the level to which every course belongs
% assert(difficulty(Course, val))
% assert(level(Course, lvl))

% and of course the level of the student
% assert(student_level(lvl))

% we can also specify student preferred difficulty
% assert(student_pref_diff(difficulty))


% setup_test_data :-
%     % Clean up any previous test data
%     retractall(courses(_)),
%     retractall(prereq(_, _)),
%     retractall(taken(_)),
%     retractall(difficulty(_, _)),
%     retractall(level(_, _)),
%     retractall(student_level(_)),
%     retractall(student_pref_diff(_)),
%     retractall(preferred(_)),
%     retractall(in_group(_,_)),

%     % Catalog
%     assertz(courses(['Intro', 'Calculus', 'CS101', 'Algorithms', 'AI'])),
    
%     % Prerequisites
%     assertz(prereq('Intro', 'Calculus')),
%     assertz(prereq('Intro', 'CS101')),
%     assertz(prereq('CS101', 'Algorithms')),
%     assertz(prereq('Calculus', 'AI')),
%     assertz(prereq('Algorithms', 'AI')),

%     % Course Attributes (Course, Value)
%     assertz(difficulty('Calculus', 3)), % Hard
%     assertz(difficulty('CS101', 1)),    % Easy
%     assertz(difficulty('Algorithms', 2)),
    
%     assertz(level('Intro', 1)),
%     assertz(level('Calculus', 2)),
%     assertz(level('CS101', 2)),
%     assertz(level('Algorithms', 3)),

%     % Student State
%     assertz(student_level(2)),        % Can take level 1 and 2
%     assertz(student_pref_diff(2)),    % Prefers difficulty 1 or 2
%     assertz(taken('Intro')),          % Finished Intro
%     assertz(preferred('Math')),       % Likes Math group

%     % Groups
%     assertz(in_group('Calculus', 'Math')).



prereqs_satisfied(Course):-
    findall(X, prereq(X, Course), Prerequisites),
    forall(
        (
            member(P, Prerequisites) 
            % generates a member then intentionally fires a false to backtrack and get the next member
        ),  taken(P)
    ).

suitable_diff(Course):-
    difficulty(Course, CourseDiff),
    student_pref_diff(StudentPrefDiff),
    CourseDiff =< StudentPrefDiff.


eligible(Course):-
    level(Course, CourseLevel),
    student_level(StudentLevel),
    CourseLevel =< StudentLevel.



can_take(Course) :-
    courses(Courses), %it must be a course to begin with
    member(Course, Courses),
    prereqs_satisfied(Course),
    eligible(Course).
% Recommendation levels

% Level 4 -- Not Very Difficult and In the Preferred Group
recommend(Course, 4):-
    can_take(Course),
    suitable_diff(Course),
    in_group(Course, Group),
    preferred(Group).

% Level 3 -- Might be Difficult but is in the Preferred Group
recommend(Course, 3):-
    can_take(Course),
    \+suitable_diff(Course),
    in_group(Course, Group),
    preferred(Group).

% Level 2 -- Not Very Difficult But Not Very Preferred
recommend(Course, 2):-
    can_take(Course),
    suitable_diff(Course),
    in_group(Course, Group),
    \+preferred(Group).

% after exhausting all choices (dfs paths from the first 3 clauses)
% Level 1 -- Might be Difficult and not preferred
recommend(Course, 1):-
    can_take(Course),
    \+suitable_diff(Course),
    in_group(Course, Group),
    \+preferred(Group).

