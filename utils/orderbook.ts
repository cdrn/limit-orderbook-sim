export interface Order extends OrderSubmissionInterface {
  idNumber: string; // Monotonically increasing order ID
  entryTime: bigint | null;
  eventTime: bigint;
  nextOrder: Order | null;
  prevOrder: Order | null;
  parentLimit: Limit | null;
}

export interface OrderSubmissionInterface {
  buy: boolean; // Buy: true, sell: false
  shares: bigint;
  limit: bigint;
}

/*
 * This object represents a singe limit. These should be organised as a binary tree of limits by price, which allows us
 * to find our desired limit in O(log(n)) time. It also contains a reference to a linked list of Orders at that price.
 */
export interface Limit {
  limitPrice: bigint;
  size: bigint;
  totalVolume: bigint;
  parent: Limit | null;
  leftChild: Limit | null;
  rightChild: Limit | null;
  // Limits must always contain at least one order -- even if the head and tail are the same.
  headOrder: Order;
  tailOrder: Order;
}

/**
 * The entire orderbook for a given asset pair. This is a binary tree of Limits, which are linked lists of Orders.
 */
export interface Book {
  buyTree: Limit | null;
  sellTree: Limit | null;
  lowestSell: Limit | null;
  highestBuy: Limit | null;
  orderMap: Record<string, Order>;
  limitBuyMap: LimitMap;
  limitSellMap: LimitMap;
}

export type LimitMap = Record<string, Limit>;

//////////////////////
// HELPER FUNCTIONS //
//////////////////////
/**
 * Traverse the binary tree of Limits, and return the Limit node with the most similar price to
 * the given price.
 * @param price
 * @param rootNode
 * @returns
 */
export const findClosestLimitFromPrice = (
  price: bigint,
  rootNode: Limit | null
): Limit | null => {
  if (rootNode === null) {
    return null;
  }
  if (rootNode.limitPrice && price < rootNode.limitPrice) {
    return findClosestLimitFromPrice(price, rootNode?.leftChild);
  } else if (rootNode.limitPrice && price < rootNode.limitPrice) {
    return findClosestLimitFromPrice(price, rootNode?.rightChild);
  } else {
    return rootNode;
  }
};

/**
 * Create a limit order where one previously did not exist. This should ONLY be used to bootstrap the
 * buy tree or sell tree
 * @param orderbook
 * @param order
 */
export const createGenesisLimit = (order: Order) => {
  const limit = {
    limitPrice: order.limit,
    size: order.shares,
    totalVolume: order.shares,
    parent: null,
    leftChild: null,
    rightChild: null,
    headOrder: order,
    tailOrder: order,
  };
  return limit;
};

/**
 * Add an order to an existing "limit" structure. Insert via the limit order hashmap, and then insert the order
 * into the corresponding linked list
 * @param order
 */
export const addOrderToLimit = (
  order: Order,
  limitBuyMap: LimitMap,
  limitSellMap: LimitMap
) => {
  // Find the limit
  let limit = order.buy
    ? limitBuyMap[order.limit.toString()]
    : limitSellMap[order.limit.toString()];

  // If no limit is found, create a limit and insert it into the limit tree
  if (!limit) {
    const newLimit = createGenesisLimit(order);
    if (order.buy) {
      limitBuyMap[order.limit.toString()] = newLimit;
    } else {
      limitSellMap[order.limit.toString()] = newLimit;
    }
    // Assign the "limit" to the holder var outside in order to append to the order LL
    limit = newLimit;
  }

  // Update the linked list
  order.prevOrder = limit.tailOrder;
  limit.tailOrder.nextOrder = order;

  return limit;
};

export const addOrderToOrderbook = (orderbook: Book, order: Order): Book => {
  // If theres no limit at the order root, we have to create one
  // Check separately for buy and sell limits
  if (order.buy) {
    if (orderbook.buyTree === null) {
      const genesisLimit = createGenesisLimit(order);
      orderbook.buyTree = genesisLimit;
      orderbook.limitBuyMap[String(genesisLimit.limitPrice)] = genesisLimit;
      console.log("THE GENESIS BUY ORDER IS", orderbook.buyTree);
    } else {
      addOrderToLimit(order, orderbook.limitBuyMap, orderbook.limitSellMap);
    }
  } else if (!order.buy) {
    if (orderbook.sellTree === null) {
      const genesisLimit = createGenesisLimit(order);
      orderbook.sellTree = genesisLimit;
      orderbook.limitSellMap[String(genesisLimit.limitPrice)] = genesisLimit;
      orderbook.sellTree = createGenesisLimit(order);
      console.log("THE GENESIS SELL ORDER IS", orderbook.sellTree);
    } else {
      addOrderToLimit(order, orderbook.limitBuyMap, orderbook.limitSellMap);
    }
  }
  // Always add the order to the orderMap
  orderbook.orderMap[order.idNumber] = order;
};

export const getLastOrderId = (orderbook: Book) => {
  return (
    Object.keys(orderbook.orderMap).sort((a, b) =>
      Number(BigInt(b) - BigInt(a))
    )[0] || 0
  ); // TODO: this is inefficient lol
};

// This will be the orderbook for a given asset pair.
export const FastLimitOrderbook = () => {
  // Represents the entire orderbook for a given asset pair
  const orderbook: Book = {
    buyTree: null,
    sellTree: null,
    lowestSell: null,
    highestBuy: null,
    orderMap: {},
    limitBuyMap: {},
    limitSellMap: {},
  };

  const addOrder = (order: OrderSubmissionInterface) => {
    const orderId = String(Number(getLastOrderId(orderbook)) + 1); // Will lose precision at 2^53 orders
    const newOrder: Order = {
      idNumber: orderId, // TODO: Implement monotonically increasing order IDs
      buy: order.buy,
      shares: order.shares,
      limit: order.limit,
      entryTime: null,
      eventTime: BigInt(Date.now()),
      nextOrder: null,
      prevOrder: null,
      parentLimit: null,
    };
    // Add the order to the orderbook.
    addOrderToOrderbook(orderbook, newOrder);
  };

  const executeOrders = () => {
    // Find the lowest sell limit, which heretofore represents the ask price of the share
    const sortedSellMap = Object.entries(orderbook.limitSellMap).sort(
      (a, b) => {
        return Number(a[1]?.limitPrice - b[1]?.limitPrice);
      }
    );
    // Find if we have a corresponding buy limit with orders
    const ask = sortedSellMap[0];
    // Check if we have a corresponding bid for the ask price
    const bid = orderbook.limitBuyMap[ask[1].limitPrice.toString()];
    console.log(sortedSellMap);
  };

  const cancelOrder = (order: Order) => {};

  const getOrdersAtLimitPrice = (limitPrice: bigint, buy: boolean) => {
    const limit = buy ? getAllBuyLimits() : getAllSellLimits();
    return limit[limitPrice.toString()].headOrder;
  };

  function getAllOrders(): Record<string, Order> {
    return orderbook.orderMap;
  }

  function getAllBuyLimits(): Record<string, Limit> {
    return orderbook.limitBuyMap;
  }

  function getAllSellLimits(): Record<string, Limit> {
    return orderbook.limitSellMap;
  }

  // Return the functions required to interact with the orderbook.
  return {
    addOrder,
    cancelOrder,
    executeOrders,
    getOrdersAtLimitPrice,
    getAllOrders,
    getAllBuyLimits,
    getAllSellLimits,
  };
};
