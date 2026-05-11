:- use_module(library(csv)).
:- use_module(library(apply)).



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
% assert(in_group(Course, Group))

% and then add then assert the taken courses
% assert(taken(Course))

% and finally assert the preferred groups
% assert(preferred(Group))

prereqs_satisfied(Course):-
    findall(X, prereq(X, Course), Prerequisites),
    forall(
        (
            member(P, Prerequisites) 
            % generates a member then intentionally fires a false to backtrack and get the next member
        ),  taken(P)
    ).


recommend(Course):-
    prereqs_satisfied(Course),
    in_group(Course, Group),
    preferred(Group).

% after exhausting all choices (dfs paths from the first clause)

recommend(Course):-
    prereqs_satisfied(Course),
    in_group(Course, Group),
    \+preferred(Group).
% then start recommending the non preferred

