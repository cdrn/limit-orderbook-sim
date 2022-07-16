## wot is it

This is a typescript implementation of a fast limit orderbook exchange primarily in memory. It's inspired by this (venerable post)[https://web.archive.org/web/20110219163448/http://howtohft.wordpress.com/2011/02/15/how-to-build-a-fast-limit-order-book/] which is a great resource for understanding the data structures required to complete standard limit order operations in O(1) time.

## why typescript

It's hard to find a way to disregard speed and safety in one language. This is a good example of how to do it.

## why is it fast

As the post explains, there are a couple of operations required for a limit orderbook:

Add – O(log M) for the first order at a limit, O(1) for all others
Cancel – O(1)
Execute – O(1)
GetVolumeAtLimit – O(1)
GetBestBid/Offer – O(1)

Let's go through them one by one:

#### Add: Supply an order and the limit price

Traverse the buy tree/sell tree (binary search) to find the correct place to insert the order. The closer the order is to the buy/ask, the more
shallow the traversal will be. Alternatively, traverse from the lowestSell or highest buy. Worst case: O(n). Insert a new tail order encapsulated by said limit. O(1).

#### Cancel: supply an order ID and limit price

Lookup order ID in keyed map. Pop order from parentLimit.

#### Execute

Whenever the limits lowestBuy and highestSell match, execute. Pop orders off the linked list. O(1).

#### GetVolumeAtLimit

Find the limit by traversing the buy tree/sell tree. O(n).

#### GetBestBid/Offer

O(1), stored at the top level.

## Thoughts

Pending benchmarks
