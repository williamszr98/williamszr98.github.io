import pandas as pd
# Read the CSV data
df = pd.read_csv("data/big-mac-source-data-v2.csv")

# Filter the data
df_filtered = df[df['name'] == 'United States']

# Output the filtered data as a CSV
df_filtered.to_csv('filtered_data.csv', index=False)