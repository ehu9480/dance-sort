import csv
import itertools
import sys

# Read CSV data and parse dances and members
def read_csv(filename):
    dances = []
    members = {}
    with open(filename, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            dance_name = row['Dance'].strip()
            if dance_name == '' or dance_name in ['Season Dances', 'Side Projects']:
                continue  # Skip empty or header rows
            member_list = [m.strip() for m in row['Members'].split(',')]
            dances.append(dance_name)
            members[dance_name] = member_list
    return dances, members

# Cost function: number of collisions in the schedule
def calculate_collisions(schedule, members):
    collisions = 0
    member_last_dance = {}
    for idx, dance in enumerate(schedule):
        dance_members = members[dance]
        for member in dance_members:
            if member in member_last_dance and member_last_dance[member] == idx - 1:
                collisions += 1
            member_last_dance[member] = idx
    return collisions

# Function to get detailed collision information
def get_collision_details(schedule, members):
    collisions = []
    member_last_dance = {}
    for idx, dance in enumerate(schedule):
        dance_members = members[dance]
        for member in dance_members:
            if member in member_last_dance and member_last_dance[member] == idx - 1:
                # Collision detected
                previous_dance = schedule[idx - 1]
                collision_info = {
                    'member': member,
                    'previous_dance': previous_dance,
                    'current_dance': dance,
                    'positions': (idx, idx + 1)  # Zero-based positions
                }
                collisions.append(collision_info)
            member_last_dance[member] = idx
    return collisions

def main():
    filename = 'loko_performances_maf.csv'
    dances, members = read_csv(filename)

    # Prompt user for start and end dances
    print("Available Dances:")
    for dance in dances:
        print(f"- {dance}")
    print()

    start_dance = input("Enter the name of the dance to start with (leave blank if none): ").strip()
    end_dance = input("Enter the name of the dance to end with (leave blank if none): ").strip()

    # Validate start and end dances
    if start_dance == '':
        start_dance = None
    elif start_dance not in dances:
        print(f"Error: '{start_dance}' is not in the list of dances.")
        return

    if end_dance == '':
        end_dance = None
    elif end_dance not in dances:
        print(f"Error: '{end_dance}' is not in the list of dances.")
        return

    # Remove start and end dances from the list if they are specified
    available_dances = dances[:]
    if start_dance and start_dance in available_dances:
        available_dances.remove(start_dance)
    if end_dance and end_dance in available_dances and end_dance != start_dance:
        available_dances.remove(end_dance)

    # Warning for large number of dances
    num_dances = len(available_dances)
    max_permutations = math.factorial(num_dances)
    if max_permutations > 1000000:
        print("Warning: The number of possible permutations is very large and may take a long time to compute.")
        proceed = input("Do you want to continue? (yes/no): ").strip().lower()
        if proceed != 'yes':
            print("Exiting the program.")
            return

    # Generate all possible permutations of the dances
    print("Generating all possible schedules...")
    all_permutations = itertools.permutations(available_dances)

    min_collisions = None
    optimal_schedules = []

    total_permutations = math.factorial(len(available_dances))
    checked = 0

    for perm in all_permutations:
        checked += 1
        # Build the full schedule with start and end dances
        schedule = list(perm)
        if start_dance:
            schedule.insert(0, start_dance)
        if end_dance:
            schedule.append(end_dance)

        # Calculate collisions
        collisions = calculate_collisions(schedule, members)

        # Update optimal schedules
        if min_collisions is None or collisions < min_collisions:
            min_collisions = collisions
            optimal_schedules = [schedule]
        elif collisions == min_collisions:
            optimal_schedules.append(schedule)

        # Optional: Print progress
        if checked % 100000 == 0:
            print(f"Checked {checked}/{total_permutations} permutations.")

    print(f"\nChecked a total of {checked} permutations.")
    print(f"Minimum number of collisions found: {min_collisions}")
    print(f"Number of optimal schedules found: {len(optimal_schedules)}")

    # Output the optimal schedules
    for idx, schedule in enumerate(optimal_schedules, 1):
        print(f"\nOptimal Schedule #{idx}:")
        for i, dance in enumerate(schedule):
            print(f"{i + 1}. {dance}")

        if min_collisions > 0:
            collision_details = get_collision_details(schedule, members)
            print(f"\nTotal Collisions: {min_collisions}")
            print("Collisions Detected:")
            for collision in collision_details:
                print(f"Between dances '{collision['previous_dance']}' and '{collision['current_dance']}'")
                print(f"Dancer '{collision['member']}' will be performing back-to-back at positions {collision['positions'][0] + 1} and {collision['positions'][1] + 1}")
                print("---")
        else:
            print("\nNo collisions in this schedule.")

if __name__ == "__main__":
    import math
    main()
