// Note: The BASE_URL and API_URL constants are no longer needed
// as the apiClient prepends the base URL from environment variables.
import apiClient from './apiClient';

export const customerApi = {
  // Get Menu
  getMenu: async () => {
    const organizationId = localStorage.getItem('organization_id');
    if (!organizationId) {
      console.error('getMenu: organization_id not found in localStorage.');
      // Returning mock menu as a fallback to prevent UI crash.
      // In a real scenario, you might want to throw an error.
      return customerApi.getMockMenu();
    }
    // We don't need auth for the menu
    return apiClient(`/api/customer/menu?organization_id=${organizationId}`, { useAuth: false });
  },

  // Place Order
  placeOrder: async ({ table_id, organization_id, group_id, member_token }) => {
    const payload = { table_id, organization_id, group_id, member_token };
    return apiClient('/customer/order', { body: payload });
  },

  // Get Order Status
  getOrderStatus: async (orderId) => {
    return apiClient(`/customer/order/${orderId}`);
  },
  // Add Item to Cart
  addItemToCart: async (cartItem) => {
    const orgId = localStorage.getItem('organization_id');
    const tableId = localStorage.getItem('table_id');
    const customerName = localStorage.getItem('customer_name') || 'Guest';

    const payload = {
      table_id: Number(tableId),
      organization_id: Number(orgId),
      menu_item_id: cartItem.id,
      quantity: cartItem.quantity,
      customer_name: customerName,
    };

    const groupId = localStorage.getItem('group_id');
    const memberToken = localStorage.getItem('member_token');

    if (groupId && memberToken) {
      payload.group_id = Number(groupId);
      payload.member_token = memberToken;
    }

    // Don't use JWT auth if in a group with a member token
    const useAuth = !(groupId && memberToken);
    return apiClient('/customer/cart', { body: payload, useAuth });
  },

  //view cart
  viewCart: async (isGroupCart = false) => {
    const groupId = localStorage.getItem('group_id');
    const memberToken = localStorage.getItem('member_token');

    let endpoint = '/customer/cart';

    // For group cart
    if (isGroupCart && groupId && memberToken) {
      endpoint += `?group_id=${groupId}&member_token=${memberToken}`;
    }
    // For personal cart in group
    else if (groupId && memberToken) {
      endpoint += `?group_id=${groupId}&member_token=${memberToken}&personal=true`;
    }

    const useAuth = !(groupId && memberToken);
    return apiClient(endpoint, { useAuth });
  },

  // Remove Item from Cart
  removeCartItem: async (itemId) => {
    const groupId = localStorage.getItem('group_id');
    const memberToken = localStorage.getItem('member_token');
    let endpoint = `/customer/cart/${itemId}`;

    // If group member, add group_id and member_token as query params, do NOT send JWT
    if (groupId && memberToken) {
      endpoint += `?group_id=${groupId}&member_token=${memberToken}`;
    }

    const useAuth = !(groupId && memberToken);
    return apiClient(endpoint, { method: 'DELETE', useAuth });
  },

  // Call Waiter
  callWaiter: async (tableId) => {
    return apiClient('/customer/waiter', { body: { table_id: tableId } });
  },

  // Create Group
  createGroup: async (tableId, organizationId) => {
    const payload = {
      table_id: Number(tableId),
      organization_id: Number(organizationId),
    };
    return apiClient('/group/create', { body: payload });
  },

  // Join Group
  joinGroup: async (groupId, name) => {
    const payload = { group_id: groupId, name: name };
    // Joining a group does not require prior authentication
    return apiClient('/group/join', { body: payload, useAuth: false });
  },

  // Check Group Status
  checkGroupStatus: async (groupId, memberToken) => {
    const endpoint = `/group/status?group_id=${groupId}&member_token=${memberToken}`;
    return apiClient(endpoint);
  },

  // View Group Cart
  viewGroupCart: async () => {
    const groupId = localStorage.getItem('group_id');
    const memberToken = localStorage.getItem('member_token');
    if (!groupId || !memberToken) throw new Error('Not in a group');
    const endpoint = `/customer/cart?group_id=${groupId}&member_token=${memberToken}`;
    return apiClient(endpoint, { useAuth: false });
  },

  // View Personal Cart
  viewPersonalCart: async () => {
    const groupId = localStorage.getItem('group_id'); // These are still needed for the endpoint string
    const memberToken = localStorage.getItem('member_token'); // but apiClient handles auth logic
    if (!groupId || !memberToken) throw new Error('Not in a group');
    const endpoint = `/customer/cart?group_id=${groupId}&member_token=${memberToken}&personal=true`;
    return apiClient(endpoint, { useAuth: false });
  },

  // Initialize Group
  initializeGroup: async () => {
    try {
      const tableId = localStorage.getItem('table_id');
      const orgId = localStorage.getItem('organization_id');
      if (!orgId || !tableId) {
        throw new Error('Organization ID or Table ID not found');
      }
      // Example: after successful group creation
      const result = await customerApi.createGroup(tableId, orgId);
      // result should contain { group_id, member_token }
      if (result && result.group_id && result.member_token) {
        localStorage.setItem('group_id', result.group_id);
        localStorage.setItem('member_token', result.member_token);
        // Optionally handle customer_name or other fields here
        // if (result.customer_name) {
        //   localStorage.setItem('customer_name', result.customer_name);
        // }
      }
      // else handle joinGroup if needed..
      // else if (result && result.group_id) { ... }
      return result;
    } catch (err) {
      console.error('Error initializing group:', err.message);
      throw err;
    }
  },

  // getMockMenu: async () => [
  //   {
  //     id: 1,
  //     name: 'Pizza',
  //     price: 299,
  //     description: 'Cheesy pizza',
  //     image: 'https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_1280.jpg',
  //     addOns: [
  //       { id: 101, name: 'Extra Cheese', price: 50 },
  //       { id: 102, name: 'Mushrooms', price: 40 },
  //       { id: 103, name: 'Pepperoni', price: 60 },
  //       { id: 104, name: 'Jalapeños', price: 30 },
  //       { id: 105, name: 'Olives', price: 35 },
  //       { id: 106, name: 'Pineapple', price: 45 },
  //       { id: 107, name: 'BBQ Sauce', price: 20 },
  //     ]
  //   },
  //   {
  //     id: 2,
  //     name: 'Veg Burger',
  //     price: 199,
  //     description: 'Fresh veggie burger',
  //     image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg',
  //     addOns: [
  //       { id: 201, name: 'Cheese Slice', price: 30 },
  //       { id: 202, name: 'Bacon', price: 50 },
  //       { id: 203, name: 'Avocado', price: 60 },
  //       { id: 204, name: 'Fried Egg', price: 40 },
  //       { id: 205, name: 'Caramelized Onions', price: 25 },
  //       { id: 206, name: 'Spicy Mayo', price: 15 },
  //     ]
  //   },
  //   {
  //     id: 3,
  //     name: 'Pasta Alfredo',
  //     price: 249,
  //     description: 'Creamy Alfredo pasta',
  //     image: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg',
  //     addOns: [
  //       { id: 301, name: 'Grilled Chicken', price: 80 },
  //       { id: 302, name: 'Shrimp', price: 100 },
  //       { id: 303, name: 'Truffle Oil', price: 60 },
  //     ]
  //   },
  //   {
  //     id: 4,
  //     name: 'French Fries',
  //     price: 99,
  //     description: 'Crispy golden fries',
  //     image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg',
  //     addOns: [
  //       { id: 401, name: 'Cheese Dip', price: 40 },
  //       { id: 402, name: 'Peri-Peri', price: 20 },
  //       { id: 403, name: 'Sour Cream', price: 30 },
  //       { id: 404, name: 'Bacon Bits', price: 50 },
  //     ]
  //   },
  //   {
  //     id: 6,
  //     name: 'Chicken Burger',
  //     price: 399,
  //     description: 'Fresh Chicken burger',
  //     image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg',
  //     addOns: [
  //       { id: 201, name: 'Cheese Slice', price: 30 },
  //       { id: 202, name: 'Bacon', price: 50 },
  //       { id: 203, name: 'Avocado', price: 60 },
  //       { id: 204, name: 'Fried Egg', price: 40 },
  //       { id: 205, name: 'Caramelized Onions', price: 25 },
  //       { id: 206, name: 'Spicy Mayo', price: 15 },
  //     ]
  //   },
  //   {
  //     id: 5,
  //     name: 'Chocolate Shake',
  //     price: 149,
  //     description: 'Rich chocolate shake',
  //     image: 'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg',
  //     addOns: [] // No add-ons for shake to test empty state
  //   }
  // ],

  // -----------------------------------------
  getMockMenu: async () => [{
    id: 1,
    name: 'Pizza',
    price: 299,
    description: 'Cheesy pizza with a crispy crust',
    image: 'https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_1280.jpg',
    addOns: [
      { id: 101, name: 'Extra Cheese', price: 50 },
      { id: 102, name: 'Mushrooms', price: 40 },
      { id: 103, name: 'Pepperoni', price: 60 },
      { id: 104, name: 'Jalapeños', price: 30 },
      { id: 105, name: 'Olives', price: 35 },
      { id: 106, name: 'Pineapple', price: 45 },
      { id: 107, name: 'BBQ Sauce', price: 20 },
    ]
  },
  {
    id: 2,
    name: 'Veg Burger',
    price: 199,
    description: 'Fresh veggie burger with crunchy lettuce',
    image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg',
    addOns: [
      { id: 201, name: 'Cheese Slice', price: 30 },
      { id: 202, name: 'Bacon (veg-style)', price: 50 },
      { id: 203, name: 'Avocado', price: 60 },
      { id: 204, name: 'Fried Egg', price: 40 },
      { id: 205, name: 'Caramelized Onions', price: 25 },
      { id: 206, name: 'Spicy Mayo', price: 15 },
    ]
  },
  {
    id: 3,
    name: 'Pasta Alfredo',
    price: 249,
    description: 'Creamy Alfredo pasta topped with parmesan',
    image: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg',
    addOns: [
      { id: 301, name: 'Grilled Chicken', price: 80 },
      { id: 302, name: 'Shrimp', price: 100 },
      { id: 303, name: 'Truffle Oil', price: 60 },
    ]
  },
  {
    id: 4,
    name: 'French Fries',
    price: 99,
    description: 'Crispy golden fries served hot',
    image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg',
    addOns: [
      { id: 401, name: 'Cheese Dip', price: 40 },
      { id: 402, name: 'Peri-Peri', price: 20 },
      { id: 403, name: 'Sour Cream', price: 30 },
      { id: 404, name: 'Bacon Bits', price: 50 },
    ]
  },
  {
    id: 5,
    name: 'Chicken Burger',
    price: 399,
    description: 'Juicy chicken patty in a soft bun',
    image: 'https://cdn.pixabay.com/photo/2014/10/23/18/05/burger-500054_1280.jpg',
    addOns: [
      { id: 501, name: 'Double Patty', price: 90 },
      { id: 502, name: 'Pickles', price: 20 },
      { id: 503, name: 'Cheddar Cheese', price: 35 },
    ]
  },
  {
    id: 6,
    name: 'Chocolate Shake',
    price: 149,
    description: 'Rich chocolate shake with whipped cream',
    image: 'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg',
    addOns: [] // No add-ons
  },
  {
    id: 7,
    name: 'Sushi Platter',
    price: 499,
    description: 'Assorted sushi rolls with wasabi and soy sauce',
    image: 'https://cdn.pixabay.com/photo/2017/05/07/08/56/sushi-2295761_1280.jpg',
    addOns: [
      { id: 701, name: 'Extra Wasabi', price: 20 },
      { id: 702, name: 'Spicy Mayo', price: 25 },
      { id: 703, name: 'Teriyaki Glaze', price: 30 },
    ]
  },
  {
    id: 8,
    name: 'Grilled Sandwich',
    price: 179,
    description: 'Toasty sandwich with mixed veggies and sauces',
    image: 'https://cdn.pixabay.com/photo/2014/10/23/18/05/sandwich-500054_1280.jpg',
    addOns: [
      { id: 801, name: 'Extra Cheese', price: 25 },
      { id: 802, name: 'Paneer Tikka Filling', price: 45 },
      { id: 803, name: 'Mint Chutney Dip', price: 15 },
    ]
  },
  {
    id: 9,
    name: 'Masala Dosa',
    price: 109,
    description: 'Classic South Indian crispy dosa with masala',
    image: 'https://cdn.pixabay.com/photo/2020/07/21/05/45/indian-food-5426141_1280.jpg',
    addOns: [
      { id: 901, name: 'Extra Masala', price: 20 },
      { id: 902, name: 'Coconut Chutney', price: 15 },
      { id: 903, name: 'Butter Topping', price: 25 },
    ]
  },
  {
    id: 10,
    name: 'Mango Lassi',
    price: 89,
    description: 'Chilled mango lassi, smooth and refreshing',
    image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/mango-lassi-1238245_1280.jpg',
    addOns: [] // No add-ons
  }
  ],


  getMockCart: async () => ({
    items: [
      {
        id: 1,
        name: 'Pizza',
        price: 299,
        description: 'Cheesy pizza',
        image: 'https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_1280.jpg',
        quantity: 2,
      },
      {
        id: 4,
        name: 'French Fries',
        price: 99,
        description: 'Crispy golden fries',
        image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg',
        quantity: 1,
      },
      {
        id: 5,
        name: 'Chocolate Shake',
        price: 149,
        description: 'Rich chocolate shake',
        image: 'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg',
        quantity: 1,
      },
    ],
    total: 846,
  }),

  getMockOrders: async () => [
    {
      id: 2,
      name: 'Veg Burger',
      price: 199,
      description: 'Fresh veggie burger',
      image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg',
      quantity: 1,
    },
    {
      id: 3,
      name: 'Pasta Alfredo',
      price: 249,
      description: 'Creamy Alfredo pasta',
      image: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg',
      quantity: 2,
    },
  ],

  getMockPayment: async () => ({
    total: 846,
    tax: 84.6,
    grandTotal: 930.6,
  }),

};