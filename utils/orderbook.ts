export interface Order extends OrderSubmissionInterface {
  idNumber?: bigint; // Monotonically increasing order ID
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

export const addOrderToOrderbook = (
  orderbook: Book,
  order: OrderSubmissionInterface
): Book => {
  // create a full order object by filling in our missing values
  const fullOrder: Order = {
    buyOrSell: order.buyOrSell,
    shares: order.shares,
    limit: order.limit,
    entryTime: null,
    eventTime: BigInt(Date.now()),
    nextOrder: null,
    prevOrder: null,
    parentLimit: null,
  };
  // If theres no limit at the order root, we have to create one
  // Check separately for buy and sell limits
  if (order.buyOrSell) {
    if (orderbook.buyTree === null) {
      orderbook.buyTree = createGenesisLimit(fullOrder);
      console.log("THE GENESIS BUY ORDER IS", orderbook.buyTree);
    } else {
      addOrderToLimit(orderbook.buyTree, fullOrder);
    }
  } else if (!order.buyOrSell) {
    if (orderbook.sellTree === null) {
      orderbook.sellTree = createGenesisLimit(fullOrder);
      console.log("THE GENESIS SELL ORDER IS", orderbook.sellTree);
    } else {
      addOrderToLimit(orderbook.sellTree, fullOrder);
    }
  }
};

// Let's try to instantiate this as a singleton. This will be the orderbook for a given asset pair.
export const FastLimitOrderbook = () => {
  // Represents the entire orderbook for a given asset pair
  const orderbook: Book = {
    buyTree: null,
    sellTree: null,
    lowestSell: null,
    highestBuy: null,
  };

  const addOrder = (order: OrderSubmissionInterface) => {
    const newOrder: Order = {
      idNumber: BigInt(1), // TODO: Implement monotonically increasing order IDs
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

  const getOrdersAtLimitPrice = (limitPrice: bigint) => {
    const limit = findClosestLimitFromPrice(limitPrice, orderbook.buyTree);
    if (limit === null) {
      throw new Error("Limit not found");
    }

    return limit.headOrder;
  };

  // Return the functions required to interact with the orderbook.
  return {
    addOrder,
    cancelOrder,
    executeOrder,
    getOrdersAtLimitPrice,
  };
};
