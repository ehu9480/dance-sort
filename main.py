import csv
import random
import math

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

# Simulated Annealing algorithm with fixed start and end dances
def simulated_annealing(dances, members, start_dance=None, end_dance=None,
                        max_iter=10000, initial_temp=1000, cooling_rate=0.003):
    # Remove start and end dances from the list if they are specified
    available_dances = dances[:]
    if start_dance and start_dance in available_dances:
        available_dances.remove(start_dance)
    if end_dance and end_dance in available_dances and end_dance != start_dance:
        available_dances.remove(end_dance)

    # Initialize with a random schedule
    current_schedule = available_dances[:]
    random.shuffle(current_schedule)

    # Add start and end dances at fixed positions
    if start_dance:
        current_schedule.insert(0, start_dance)
    if end_dance:
        current_schedule.append(end_dance)

    current_cost = calculate_collisions(current_schedule, members)
    best_schedule = current_schedule[:]
    best_cost = current_cost
    temp = initial_temp

    # Indices of dances that can be swapped (excluding fixed start and end)
    fixed_indices = set()
    if start_dance:
        fixed_indices.add(0)
    if end_dance:
        fixed_indices.add(len(current_schedule) - 1)

    swap_indices = [i for i in range(len(current_schedule)) if i not in fixed_indices]

    for iteration in range(max_iter):
        # Temperature decreases with each iteration
        temp = temp * (1 - cooling_rate)
        if temp <= 0:
            break

        # Create a new neighbor by swapping two dances (excluding fixed dances)
        new_schedule = current_schedule[:]
        idx1, idx2 = random.sample(swap_indices, 2)
        new_schedule[idx1], new_schedule[idx2] = new_schedule[idx2], new_schedule[idx1]
        new_cost = calculate_collisions(new_schedule, members)

        # Calculate acceptance probability
        delta_cost = new_cost - current_cost
        if delta_cost < 0:
            acceptance_probability = 1.0
        else:
            acceptance_probability = math.exp(-delta_cost / temp)

        # Decide whether to accept the new schedule
        if acceptance_probability > random.random():
            current_schedule = new_schedule
            current_cost = new_cost
            if current_cost < best_cost:
                best_schedule = current_schedule[:]
                best_cost = current_cost

        # Optional: print progress every 1000 iterations
        if iteration % 1000 == 0:
            print(f"Iteration {iteration}: Current Collisions = {current_cost}, Best Collisions = {best_cost}")

        # Early exit if perfect schedule is found
        if best_cost == 0:
            break

    return best_schedule, best_cost

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

    # Run the simulated annealing algorithm
    best_schedule, best_cost = simulated_annealing(
        dances, members, start_dance=start_dance, end_dance=end_dance)

    print("\nOptimal Dance Schedule:")
    for idx, dance in enumerate(best_schedule):
        print(f"{idx + 1}. {dance}")

    print(f"\nTotal Collisions: {best_cost}")

    # If there are collisions, output detailed collision information
    if best_cost > 0:
        collision_details = get_collision_details(best_schedule, members)
        print("\nCollisions Detected:")
        for collision in collision_details:
            print(f"Between dances '{collision['previous_dance']}' and '{collision['current_dance']}'")
            print(f"{collision['member']} will be performing back-to-back")
            print("---")

if __name__ == "__main__":
    main()
