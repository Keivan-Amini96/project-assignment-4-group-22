let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
//Dom elements
const cartToggle = document.getElementById("cart-toggle");
const closeCart = document.getElementById("close-cart");
const cartSidebar = document.getElementById("cart-sidebar");
const searchBar = document.querySelector(".search-bar input");
const searchButton = document.querySelector(".search-bar button");
const categoryGrid = document.querySelector(".category-grid");
const mainContent = document.querySelector("main");
const sqlurl = "http://ec2-3-86-24-216.compute-1.amazonaws.com:5000";

// set login
window.onload = function (){
    const globalValue = localStorage.getItem('username');

    if (globalValue) {
        document.getElementById('homepagelogin').textContent = globalValue;
    } else {
        console.log(" adrian111 " + globalValue);
        document.getElementById('homepagelogin').textContent = 'Login';
    }
};


//Toggle the cart sidebar
cartToggle?.addEventListener("click", () => {
    if (cartSidebar) {
        cartSidebar.style.right = cartSidebar.style.right === "0px" ? "-400px" : "0px";
    } else {
        console.error("Cart sidebar element not found.");
        showNotification("Cart functionality is unavailable.", "error");
    }
});

//For closing cart sidebar
closeCart?.addEventListener("click", () => {
    if (cartSidebar) {
        cartSidebar.style.right = "-400px";
    } else {
        console.error("Cart sidebar element not found.");
    }
});

//Fetch products from JSON

//
fetch(sqlurl+"/api/productlist")
    .then(response => response.json())
    .then(data => {
        products = data;
        const isProductDetailPage = checkIfProductDetailPage();
        if (isProductDetailPage) {
            fetchProductDetails();
        } else {
            applyInitialFilters(); 
        }
        loadCartFromLocalStorage();
    })
    .catch(error => console.error('Error fetching products:', error));
function checkIfProductDetailPage() {
    return window.location.pathname.includes('productDetail.html');
}

//-------Cart Functions 

//Load cart from localStorage and render it
function loadCartFromLocalStorage() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
        renderCart();
    }
}

function renderCart() {
    const cartItemsContainer = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");

    if (!cartItemsContainer || !cartCount) {
        console.error("Cart elements not found.");
        return;
    }

    cartItemsContainer.innerHTML = "";
    let subtotal = 0;

    //Render each item in the cart dynamically
    cart.forEach((item, index) => {
        const cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");
        cartItem.innerHTML = `
            <p>${item.name}</p>
            <p>Price: $${item.price}</p>
            <div class="quantity-controls">
                <button class="decrease-quantity" data-index="${index}">-</button>
                <span>${item.quantity}</span>
                <button class="increase-quantity" data-index="${index}">+</button>
            </div>
            <p>Total: $${(item.price * item.quantity).toFixed(2)}</p>
            <button class="remove-item" data-index="${index}">Remove</button>
        `;
        cartItemsContainer.appendChild(cartItem);
        subtotal += item.price * item.quantity;
    });

    // Calculate shipping and tax dynamically
    const shippingCost = subtotal > 0 ? 10 : 0;
    const taxCost = subtotal * 0.13;
    const finalTotal = subtotal + shippingCost + taxCost;

    // Dynamically append shipping, tax, and total
    const shippingElement = document.createElement("div");
    shippingElement.classList.add("cart-summary");
    shippingElement.innerHTML = `
        <p>Subtotal: $${subtotal.toFixed(2)}</p>
        <p>Shipping: $${shippingCost.toFixed(2)}</p>
        <p>Tax: $${taxCost.toFixed(2)}</p>
        <strong>Total: $${finalTotal.toFixed(2)}</strong>
    `;
    cartItemsContainer.appendChild(shippingElement);

    // Update cart count
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0); // Total items

    //Event listeners for quantity controls and remove buttons
    const decreaseButtons = document.querySelectorAll(".decrease-quantity");
    const increaseButtons = document.querySelectorAll(".increase-quantity");
    const removeButtons = document.querySelectorAll(".remove-item");

    decreaseButtons.forEach(button =>
        button.addEventListener("click", () => adjustQuantity(button.dataset.index, -1))
    );

    increaseButtons.forEach(button =>
        button.addEventListener("click", () => adjustQuantity(button.dataset.index, 1))
    );

    removeButtons.forEach(button =>
        button.addEventListener("click", () => removeFromCart(button.dataset.index))
    );

    // Save the updated cart in localStorage
    localStorage.setItem("cart", JSON.stringify(cart));
}

//Add to cart
function addToCart(productId) {
    const product = products.find(item => item.id === productId);

    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        renderCart();
        showNotification(`${product.name} added to cart.`, "success");
    } else {
        console.error("Product not found:", productId);
        showNotification("Failed to add the product to the cart.", "error");
    }
}

//Quantity
function adjustQuantity(index, change) {
    const item = cart[index];
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart.splice(index, 1); //Remove if it is 0
        }
        renderCart();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

//Checkout
function checkout() {
    if (cart.length === 0) {
        showNotification("Your cart is empty. Add some items before checking out.", "error");
        return;
    }
    showNotification("Redirecting to checkout page...", "success");
    window.location.href = "checkout.html";
}

//----------Product Listing Functions

//For choosing a category from the Hompepage
function applyInitialFilters() {
    const selectedCategory = getUrlParameter('category');
    if (selectedCategory) {
        const categoryDropdown = document.getElementById('categories');
        if (categoryDropdown) {
            categoryDropdown.value = selectedCategory;
        }
        filterProducts(); //Apply the filters
    } else {
        renderProducts(products);
    }
}

//Render products
function renderProducts(productsToRender) {
    const productsContainer = document.querySelector('.products');
    if (!productsContainer) return;

    productsContainer.innerHTML = '';

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>$${product.price}</p>
            <button onclick="addToCart(${product.id})">Add to Cart</button>
            <button onclick="viewDetails(${product.id})">View Details</button>
        `;

        productsContainer.appendChild(productCard);
    });
}
function getUrlParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function filterProducts() {
    const selectedCategory = document.getElementById("categories").value.toLowerCase();
    const selectedBrand = document.getElementById("brands").value.toLowerCase();
    const priceRangeSlider = document.getElementById("price-range");
    const priceRange = parseInt(priceRangeSlider.value || priceRangeSlider.max, 10); //Parse price as integer

    //Filtering
    const filteredProducts = products.filter(product => {
        const isCategoryMatch = selectedCategory === "all" || product.category.toLowerCase() === selectedCategory;
        const isBrandMatch = selectedBrand === "all" || product.brand.toLowerCase() === selectedBrand;
        const isPriceMatch = product.price <= priceRange;

        return isCategoryMatch && isBrandMatch && isPriceMatch;
    });

    renderProducts(filteredProducts);
}


//Eventlisteners for filters
const categoryDropdown = document.getElementById("categories");
const brandDropdown = document.getElementById("brands");

if (categoryDropdown) {
    categoryDropdown.addEventListener("change", filterProducts);
}
if (brandDropdown) {
    brandDropdown.addEventListener("change", filterProducts);
}
const priceRangeSlider = document.getElementById("price-range");
if (priceRangeSlider) {
    document.addEventListener("DOMContentLoaded", () => {
        priceRangeSlider.value = priceRangeSlider.max; // Set slider to maximum value on load
        document.getElementById("price-range-value").textContent = `$0 - $${priceRangeSlider.max}`; // Update the displayed range
    });

    priceRangeSlider.addEventListener("input", () => {
        document.getElementById("price-range-value").textContent = `$0 - $${priceRangeSlider.value}`;
        filterProducts();
    });
}

function sortProducts() {
    const sortOption = document.getElementById('sort').value;

    const sortedProducts = [...products];

    //Sorting
    if (sortOption === 'price-low-high') {
        sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high-low') {
        sortedProducts.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'popularity') {
        sortedProducts.sort((a, b) => b.popularity - a.popularity); // Assuming products have a 'popularity' field
    }

    //render again the sorted
    renderProducts(sortedProducts);
}
const sortDropdown = document.getElementById('sort');
if (sortDropdown) {
    sortDropdown.addEventListener('change', sortProducts);
}

//View details
function viewDetails(productId) {
    window.location.href = `productDetail.html?id=${productId}`;
}

// --------Product Detail Page Functions

//Fetch and render product details
function fetchProductDetails() {
    const productId = getProductIdFromUrl();
    const product = products.find((p) => p.id === parseInt(productId));

    if (product) {
        renderProductDetails(product);
    } else {
        console.error('Product not found');
    }
}

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

//Render product details
function renderProductDetails(product) {
    document.querySelector('#main-image').src = product.gallery[0];
    document.querySelector('.product-info h1').textContent = product.name;
    document.querySelector('.product-info .price').textContent = `$${product.price}`;
    document.querySelector('.product-info .availability span').textContent = product.availability;
    document.querySelector('.product-info .description').textContent = product.description;

    const thumbnailsContainer = document.querySelector('.gallery-thumbnails');
    thumbnailsContainer.innerHTML = '';

    product.gallery.forEach((image) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = image;
        thumbnail.alt = product.name;
        thumbnail.onclick = () => {
            document.querySelector('#main-image').src = image;
        };
        thumbnailsContainer.appendChild(thumbnail);
    });

    const addToCartButton = document.querySelector('.add-to-cart');
    if (addToCartButton) {
        addToCartButton.onclick = () => addToCart(product.id);
    }
}

// ------------------Notifications

//For the customized alerts
function showNotification(message, type = "info") {
    const container = document.getElementById("notification-container");

    const notification = document.createElement("div");
    notification.classList.add("notification");

    notification.innerHTML = `
        ${message}
        <button class="close-btn">&times;</button>
    `;

    if (type === "error") {
        notification.style.backgroundColor = "#c89666";
    } else if (type === "success") {
        notification.style.backgroundColor = "#2d545e";
    }

    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3500);

    notification.querySelector(".close-btn").addEventListener("click", () => {
        notification.remove();
    });
}
document.addEventListener("DOMContentLoaded", () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const placeOrderBtn = document.querySelector(".checkout-form button[type='submit']");
    const modal = document.getElementById("order-confirmation-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const orderSummary = document.querySelector(".order-summary");

    function displayCartItems() {
        if (cart.length === 0) {
            orderSummary.innerHTML = "<p>Your cart is empty.</p>";
        } else {
            let subtotal = 0;
    
            const itemList = cart
                .map((item) => {
                    subtotal += item.price * item.quantity;
                    return `
                        <div class="cart-item">
                            <p>${item.name}</p>
                            <p>Quantity: ${item.quantity}</p>
                            <p>Price: $${item.price.toFixed(2)}</p>
                        </div>
                    `;
                })
                .join("");
    
            const { shippingCost, taxCost, finalTotal } = calculateCosts(subtotal);
    
            const totalSummary = `
                <div class="total-summary">
                    <p>Subtotal: $${subtotal.toFixed(2)}</p>
                    <p>Shipping: $${shippingCost.toFixed(2)}</p>
                    <p>Tax: $${taxCost.toFixed(2)}</p>
                    <strong>Total: $${finalTotal.toFixed(2)}</strong>
                </div>
            `;
    
            orderSummary.innerHTML = itemList + totalSummary;
        }
    }
    

    displayCartItems();

    placeOrderBtn.addEventListener("click", async (e) => {
        e.preventDefault();
    
        if (cart.length === 0) {
            showNotification("Your cart is empty! Add items to the cart before placing an order.");
            return;
        }
    
        const userEmail = document.getElementById("email").value;
        const orderDetails = {
            email: userEmail,
            items: cart,
            total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        };
    
        try {
            const response = await fetch("http://ec2-3-86-24-216.compute-1.amazonaws.com:5000/api/send-order-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderDetails),
            });
    
            if (response.ok) {
                showNotification("Order placed successfully! A confirmation email has been sent.");
                modal.classList.remove("hidden");
                localStorage.removeItem("cart");
            } else {
                showNotification("Failed to send confirmation email. Please try again.");
            }
        } catch (error) {
            console.error("Error placing order:", error);
            showNotification("An error occurred while placing your order. Please try again.");
        }
    });
    
});