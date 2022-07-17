export interface Order extends OrderSubmissionInterface {
  idNumber: string; // Monotonically increasing order ID
  entryTime: bigint | null;
  eventTime: bigint;
  nextOrder: Order | null;
  prevOrder: Order | null;
  parentLimit: Limit | null;
}

export interface OrderSubmissionInterface {
  buyOrSell: boolean; // Buy: true, sell: false
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
  limitMap: Record<string, Limit>;
}

//////////////////////
// HELPER FUNCTIONS //
//////////////////////
/**
 * Traverse the binary tree of Limits, and return the Limit node with the most similar price to
 * the given price.
 * @param price
 * @param tree
 * @returns
 */
export const findClosestLimitFromPrice = (
  price: bigint,
  tree: Limit | null
): Limit | null => {
  if (tree === null) {
    return null;
  }

  if (tree.limitPrice && price < tree.limitPrice) {
    return findClosestLimitFromPrice(price, tree?.leftChild);
  } else if (tree.limitPrice && price < tree.limitPrice) {
    return findClosestLimitFromPrice(price, tree?.rightChild);
  } else {
    return tree;
  }
};

/**
 * Create a limit order where one previously did not exist.
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
 * Add an order to an existing "limit" structure.
 * @param orderbook
 * @param order
 */
export const addOrderToLimit = (BuyOrSellTree: Limit, order: Order) => {
  return;
};

export const addOrderToOrderbook = (orderbook: Book, order: Order): Book => {
  // If theres no limit at the order root, we have to create one
  // Check separately for buy and sell limits
  if (order.buyOrSell) {
    if (orderbook.buyTree === null) {
      const genesisLimit = createGenesisLimit(order);
      orderbook.buyTree = genesisLimit;
      orderbook.limitMap[String(genesisLimit.limitPrice)] = genesisLimit;
      console.log("THE GENESIS BUY ORDER IS", orderbook.buyTree);
    } else {
      addOrderToLimit(orderbook.buyTree, order);
    }
  } else if (!order.buyOrSell) {
    if (orderbook.sellTree === null) {
      const genesisLimit = createGenesisLimit(order);
      orderbook.sellTree = genesisLimit;
      orderbook.limitMap[String(genesisLimit.limitPrice)] = genesisLimit;
      orderbook.sellTree = createGenesisLimit(order);
      console.log("THE GENESIS SELL ORDER IS", orderbook.sellTree);
    } else {
      addOrderToLimit(orderbook.sellTree, order);
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
    limitMap: {},
  };

  const addOrder = (order: OrderSubmissionInterface) => {
    const orderId = String(Number(getLastOrderId(orderbook)) + 1); // Will lose precision at 2^53 orders
    const newOrder: Order = {
      idNumber: orderId, // TODO: Implement monotonically increasing order IDs
      buyOrSell: order.buyOrSell,
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

  const executeOrder = (order: Order) => {};

  const cancelOrder = (order: Order) => {};

  const getOrdersAtLimitPrice = (limitPrice: bigint, buy: boolean) => {
    const limit = findClosestLimitFromPrice(
      limitPrice,
      buy ? orderbook.buyTree : orderbook.sellTree
    );
    if (limit === null) {
      return;
    }
    return limit.headOrder;
  };

  function getAllOrders() {
    return orderbook.orderMap;
  }

  function getAllLimits() {
    return orderbook.limitMap;
  }

  // Return the functions required to interact with the orderbook.
  return {
    addOrder,
    cancelOrder,
    executeOrder,
    getOrdersAtLimitPrice,
    getAllOrders,
    getAllLimits,
  };
};
