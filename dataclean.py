import pandas as pd
import numpy as np

# Load the data
df = pd.read_csv('data/big-mac-source-data-v2.csv')

# Convert 'date' to datetime
df['date'] = pd.to_datetime(df['date'])

# Get the US prices
us_prices = df[df['name'] == 'United States'][['date', 'local_price']]
us_prices.rename(columns={'local_price': 'us_local_price'}, inplace=True)

# Merge the dataframes on 'date'
df = pd.merge(df, us_prices, on='date', how='left')

# Calculate 'big_mac_ex'
df['big_mac_ex'] = df['local_price'] / df['us_local_price']

df['over_under_value'] = (df['big_mac_ex'] - df['dollar_ex']) / df['dollar_ex']
# Replace inf and -inf with NaN (null)
df.replace([np.inf, -np.inf], np.nan, inplace=True)

# Write the result to a new CSV file
df.to_csv('processed-big-mac-source-data.csv', index=False)