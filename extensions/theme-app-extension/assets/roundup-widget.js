(function() {
  var widget = document.getElementById('roundup-donation-widget');
  if (!widget) return;

  var buttons = widget.querySelectorAll('.roundup-btn');
  var thanksDiv = widget.querySelector('.roundup-thanks');
  var thanksDetail = widget.querySelector('.roundup-thanks-detail');
  var buttonsContainer = widget.querySelector('.roundup-buttons');
  var appUrl = widget.getAttribute('data-app-url') || '';
  var charityName = widget.getAttribute('data-charity-name') || 'charity';
  var donationVariantId = widget.getAttribute('data-donation-variant-id') || '';
  var shopDomain = (window.Shopify && window.Shopify.shop) ? window.Shopify.shop : '';
  var donationInProgress = false;
  var variantReady = !!donationVariantId;

  if (!donationVariantId && appUrl && shopDomain) {
    fetch(appUrl + '/api/ext/donation-product?shop=' + encodeURIComponent(shopDomain))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.variantId) {
          donationVariantId = String(data.variantId);
          variantReady = true;
          updateRoundUpButton();
        }
      })
      .catch(function(err) {
        console.warn('RoundUp: Could not fetch donation product', err);
      });
  }

  function getCart() {
    return fetch('/cart.js')
      .then(function(res) { return res.json(); });
  }

  function getCartTotal() {
    return getCart().then(function(cart) { return cart.total_price / 100; });
  }

  function removePreviousDonation() {
    return getCart().then(function(cart) {
      if (!donationVariantId) return cart;
      var donationLine = null;
      for (var i = 0; i < cart.items.length; i++) {
        if (String(cart.items[i].variant_id) === String(donationVariantId)) {
          donationLine = cart.items[i];
          break;
        }
      }
      if (!donationLine) return cart;
      return fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: String(donationLine.variant_id),
          quantity: 0
        })
      }).then(function(res) { return res.json(); });
    });
  }

  function addDonationToCart(amount, type) {
    if (!donationVariantId) {
      return setCartAttributes(amount, type);
    }

    var quantity = Math.round(amount * 100);

    return removePreviousDonation().then(function() {
      return fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            id: parseInt(donationVariantId),
            quantity: quantity,
            properties: {
              '_donation': 'true',
              '_donation_type': type,
              '_charity': charityName,
              '_amount': amount.toFixed(2)
            }
          }]
        })
      }).then(function(res) { return res.json(); });
    }).then(function() {
      return setCartAttributes(amount, type);
    });
  }

  function setCartAttributes(amount, type) {
    return fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes: {
          'roundup_donation_amount': amount.toFixed(2),
          'roundup_donation_type': type,
          'roundup_charity': charityName
        }
      })
    });
  }

  function clearDonation() {
    return removePreviousDonation().then(function() {
      return fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attributes: {
            'roundup_donation_amount': '',
            'roundup_donation_type': '',
            'roundup_charity': ''
          }
        })
      });
    });
  }

  function updateRoundUpButton() {
    var roundUpBtn = widget.querySelector('[data-action="round_up"]');
    if (!roundUpBtn) return;

    getCartTotal().then(function(total) {
      if (total <= 0) {
        roundUpBtn.style.display = 'none';
        return;
      }
      var roundUp = Math.ceil(total) - total;
      if (roundUp === 0) roundUp = 1;
      roundUpBtn.textContent = 'Round Up +$' + roundUp.toFixed(2);
      roundUpBtn.setAttribute('data-amount', roundUp.toFixed(2));
      roundUpBtn.style.display = '';
    });
  }

  function recordDonation(amount, type, total) {
    if (!appUrl || !shopDomain) return;
    fetch(appUrl + '/api/ext/storefront-donation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount.toFixed(2),
        originalTotal: total.toFixed(2),
        roundedTotal: (total + amount).toFixed(2),
        donationType: type,
        channel: 'checkout',
        shopDomain: shopDomain
      })
    }).catch(function(err) {
      console.warn('RoundUp: Could not record donation', err);
    });
  }

  updateRoundUpButton();

  buttons.forEach(function(btn) {
    btn.addEventListener('mouseenter', function() {
      if (!btn.classList.contains('roundup-selected')) {
        btn.style.background = 'var(--color-foreground, #000)';
        btn.style.color = 'var(--color-background, #fff)';
        btn.style.borderColor = 'var(--color-foreground, #000)';
      }
    });
    btn.addEventListener('mouseleave', function() {
      if (!btn.classList.contains('roundup-selected')) {
        btn.style.background = 'transparent';
        btn.style.color = 'inherit';
        btn.style.borderColor = 'var(--color-border, #e5e5e5)';
      }
    });

    btn.addEventListener('click', function() {
      if (donationInProgress) return;
      var action = btn.getAttribute('data-action');
      var amount = parseFloat(btn.getAttribute('data-amount') || '0');
      var wasSelected = btn.classList.contains('roundup-selected');

      buttons.forEach(function(b) {
        b.classList.remove('roundup-selected');
        b.style.background = 'transparent';
        b.style.color = 'inherit';
        b.style.borderColor = 'var(--color-border, #e5e5e5)';
      });

      if (wasSelected) {
        donationInProgress = true;
        btn.textContent = 'Removing...';
        clearDonation().then(function() {
          thanksDiv.style.display = 'none';
          donationInProgress = false;
          updateRoundUpButton();
          location.reload();
        }).catch(function() {
          donationInProgress = false;
          updateRoundUpButton();
        });
        return;
      }

      btn.classList.add('roundup-selected');
      btn.style.background = 'var(--color-foreground, #000)';
      btn.style.color = 'var(--color-background, #fff)';
      btn.style.borderColor = 'var(--color-foreground, #000)';

      var originalText = btn.textContent;
      btn.textContent = 'Adding...';
      donationInProgress = true;

      getCartTotal().then(function(total) {
        return addDonationToCart(amount, action).then(function() {
          thanksDetail.textContent = 'You added $' + amount.toFixed(2) + ' for ' + charityName;
          thanksDiv.style.display = 'block';
          donationInProgress = false;
          btn.textContent = originalText;
          recordDonation(amount, action, total);
          location.reload();
        });
      }).catch(function(err) {
        console.error('RoundUp: Failed to add donation', err);
        donationInProgress = false;
        btn.textContent = originalText;
        btn.classList.remove('roundup-selected');
        btn.style.background = 'transparent';
        btn.style.color = 'inherit';
      });
    });
  });
})();
