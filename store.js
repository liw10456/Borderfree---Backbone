//Model//
(function() {

    var Product = Backbone.Model.extend({})

    var ProductCollection = Backbone.Collection.extend({
        model: Product,

        initialize: function(models, options) {
            this.url = options.url;
        },

        comparator: function(item) {
            return item.get('name');
        }
    });



    var Item = Backbone.Model.extend({
        update: function(amount) {
            this.set({'quantity': amount}, {silent: true});
            this.collection.trigger('change', this);
        },
        //different prices, sale=true, price->salyPrice;sale=false,listPrice
        //shipping fees
        price: function() {
            console.log(this.get('product').get('name'), this.get('quansy'));
            return this.get('product').get('price') * this.get('quantity');
        }





    });

//Collection//
    var ItemCollection = Backbone.Collection.extend({
        model: Item,

        getOrCreateItemForProduct: function(product) {
            var i, 
            pid = product.get('id'),
            o = this.detect(function(obj) { 
                return (obj.get('product').get('id') == pid); 
            });
            if (o) { 
                return o;
            }
            i = new Item({'product': product, 'quantity': 0})
            this.add(i, {silent: true})
            return i;
        },
        //Indicate Quatity 
        getTotalCount: function() {
            return this.reduce(function(memo, obj) { 
                return obj.get('quantity') + memo; }, 0);
        },
        //Indicate Quatity from client side
        getTotalCost: function() {  
            return this.reduce(function(memo, obj) { 
                return obj.price() + memo; }, 0);
        }
    });




//View//
    var _BaseView = Backbone.View.extend({
        parent: $('#main'),
        className: 'viewport',

        initialize: function() {
            this.el = $(this.el);
            this.el.hide();
            this.parent.append(this.el);
            return this;
        },

        hide: function() {
            if (this.el.is(":visible") === false) {
                return null;
            }
            promise = $.Deferred(_.bind(function(dfd) { 
                this.el.fadeOut('medium', dfd.resolve)}, this));
            return promise.promise();
        },

        show: function() {
            if (this.el.is(':visible')) {
                return;
            }       
            promise = $.Deferred(_.bind(function(dfd) { 
                this.el.fadeIn('fast', dfd.resolve) }, this))
            return promise.promise();
        }
    });

//for products.json
    var ProductListView = _BaseView.extend({
        id: 'productlistview',
        template: $("#store_index_template").html(),

        initialize: function(options) {
            this.constructor.__super__.initialize.apply(this, [options])
            this.collection.bind('reset', _.bind(this.render, this));
        },

        render: function() {
            this.el.html(_.template(this.template, 
                                    {'products': this.collection.toJSON()}))
            return this;
        }
    });

//for cart.json

    var ShippingListView = _BaseView.extend({
        id: 'shippinglistview',
        template: $("#shipping_index_template").html(),

        initialize: function(options) {
            this.constructor.__super__.initialize.apply(this, [options])
            this.collection.bind('reset', _.bind(this.render, this));
        },

        render: function() {
            this.el.html(_.template(this.template, 
                                    {'cart': this.collection.toJSON()}))
            return this;
        }
    });
    

    var ProductView = _BaseView.extend({
        id: 'productitemview',
        template: $("#store_item_template").html(),
        initialize: function(options) {
            this.constructor.__super__.initialize.apply(this, [options])
            this.itemcollection = options.itemcollection;
            this.item = this.itemcollection.getOrCreateItemForProduct(this.model);
            return this;
        },
<!--for information updated-->
        events: {
            "keypress .uqf" : "updateOnEnter",
            "click .uq"     : "update", 
        },

        update: function(e) {
            e.preventDefault();
            this.item.update(parseInt(this.$('.uqf').val()));
        },
        
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                return this.update(e);
            }
        },

        render: function() {
            this.el.html(_.template(this.template, this.model.toJSON()));
            return this;
        }
    });


    var CartWidget = Backbone.View.extend({
        el: $('.cart-info'),
        template: $('#store_cart_template').html(),
        
        initialize: function() {
            this.collection.bind('change', _.bind(this.render, this));
        },
        
        render: function() {
            this.el.html(
                _.template(this.template, {
                    'count': this.collection.getTotalCount(),
                    'cost': this.collection.getTotalCost()
                })).animate({paddingRight: '30px'})
                .animate({paddingRight: '10px'});
        }
    });


    var BackboneStore = Backbone.Router.extend({
        views: {},
        products: null,
        cart: null,

        routes: {
            "": "index",
            "item/:id": "product",
        },

        initialize: function(data) {
            this.cart = new ItemCollection();
            new CartWidget({collection: this.cart});

            this.products = new ProductCollection([], {
                url: 'data/products.json'});
            this.views = {
                '_index': new ProductListView({
                    collection: this.products
                })
            };
            $.when(this.products.fetch({reset: true}))
                .then(function() { window.location.hash = ''; });
            return this;
        },

        hideAllViews: function () {
            return _.select(
                _.map(this.views, function(v) { return v.hide(); }), 
                function (t) { return t != null });
        },

        index: function() {
            var view = this.views['_index'];
            $.when(this.hideAllViews()).then(
                function() { return view.show(); });
        },

        product: function(id) {
            var product, v, view;
            product = this.products.detect(function(p) { return p.get('id') == (id); })
            view = ((v = this.views)['item.' + id]) || (v['item.' + id] = (
                new ProductView({model: product, 
                                 itemcollection: this.cart}).render()));
            $.when(this.hideAllViews()).then(
                function() { view.show(); });
        }
    });

    $(document).ready(function() {
        new BackboneStore();
        Backbone.history.start();
    });

}).call(this);

//this area is for search box using filter.js
//View
//Model//
(function() {

    var Product = Backbone.Model.extend({})

    var ProductCollection = Backbone.Collection.extend({
        model: Product,

        initialize: function(models, options) {
            this.url = options.url;
        },

        comparator: function(item) {
            return item.get('name');
        }
    });



    var Item = Backbone.Model.extend({
        update: function(amount) {
            this.set({'quantity': amount}, {silent: true});
            this.collection.trigger('change', this);
        },
        price: function() {
            console.log(this.get('product').get('name'), this.get('quansy'));
            return this.get('product').get('price') * this.get('quantity');
        }





    });

//Collection//
    var ItemCollection = Backbone.Collection.extend({
        model: Item,

        getOrCreateItemForProduct: function(product) {
            var i, 
            pid = product.get('id'),
            o = this.detect(function(obj) { 
                return (obj.get('product').get('id') == pid); 
            });
            if (o) { 
                return o;
            }
            i = new Item({'product': product, 'quantity': 0})
            this.add(i, {silent: true})
            return i;
        },
        //Indicate Quatity 
        getTotalCount: function() {
            return this.reduce(function(memo, obj) { 
                return obj.get('quantity') + memo; }, 0);
        },
        //Indicate Quatity from client side
        getTotalCost: function() {  
            return this.reduce(function(memo, obj) { 
                return obj.price() + memo; }, 0);
        }
    });




//View//
    var _BaseView = Backbone.View.extend({
        parent: $('#main'),
        className: 'viewport',

        initialize: function() {
            this.el = $(this.el);
            this.el.hide();
            this.parent.append(this.el);
            return this;
        },

        hide: function() {
            if (this.el.is(":visible") === false) {
                return null;
            }
            promise = $.Deferred(_.bind(function(dfd) { 
                this.el.fadeOut('medium', dfd.resolve)}, this));
            return promise.promise();
        },

        show: function() {
            if (this.el.is(':visible')) {
                return;
            }       
            promise = $.Deferred(_.bind(function(dfd) { 
                this.el.fadeIn('fast', dfd.resolve) }, this))
            return promise.promise();
        }
    });

//for products.json
    var ProductListView = _BaseView.extend({
        id: 'productlistview',
        template: $("#store_index_template").html(),

        initialize: function(options) {
            this.constructor.__super__.initialize.apply(this, [options])
            this.collection.bind('reset', _.bind(this.render, this));
        },

        render: function() {
            this.el.html(_.template(this.template, 
                                    {'products': this.collection.toJSON()}))
            return this;
        }
    });

//for cart.json

    var ShippingListView = _BaseView.extend({
        id: 'shippinglistview',
        template: $("#shipping_index_template").html(),

        initialize: function(options) {
            this.constructor.__super__.initialize.apply(this, [options])
            this.collection.bind('reset', _.bind(this.render, this));
        },

        render: function() {
            this.el.html(_.template(this.template, 
                                    {'cart': this.collection.toJSON()}))
            return this;
        }
    });
    

    var ProductView = _BaseView.extend({
        id: 'productitemview',
        template: $("#store_item_template").html(),
        initialize: function(options) {
            this.constructor.__super__.initialize.apply(this, [options])
            this.itemcollection = options.itemcollection;
            this.item = this.itemcollection.getOrCreateItemForProduct(this.model);
            return this;
        },

        events: {
            "keypress .uqf" : "updateOnEnter",
            "click .uq"     : "update",
        },

        update: function(e) {
            e.preventDefault();
            this.item.update(parseInt(this.$('.uqf').val()));
        },
        
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                return this.update(e);
            }
        },

        render: function() {
            this.el.html(_.template(this.template, this.model.toJSON()));
            return this;
        }
    });


    var CartWidget = Backbone.View.extend({
        el: $('.cart-info'),
        template: $('#store_cart_template').html(),
        
        initialize: function() {
            this.collection.bind('change', _.bind(this.render, this));
        },
        
        render: function() {
            this.el.html(
                _.template(this.template, {
                    'count': this.collection.getTotalCount(),
                    'cost': this.collection.getTotalCost()
                })).animate({paddingRight: '30px'})
                .animate({paddingRight: '10px'});
        }
    });


    var BackboneStore = Backbone.Router.extend({
        views: {},
        products: null,
        cart: null,

        routes: {
            "": "index",
            "item/:id": "product",
        },

        initialize: function(data) {
            this.cart = new ItemCollection();
            new CartWidget({collection: this.cart});

            this.products = new ProductCollection([], {
                url: 'data/products.json'});
            this.views = {
                '_index': new ProductListView({
                    collection: this.products
                })
            };
            $.when(this.products.fetch({reset: true}))
                .then(function() { window.location.hash = ''; });
            return this;
        },

        hideAllViews: function () {
            return _.select(
                _.map(this.views, function(v) { return v.hide(); }), 
                function (t) { return t != null });
        },

        index: function() {
            var view = this.views['_index'];
            $.when(this.hideAllViews()).then(
                function() { return view.show(); });
        },

        product: function(id) {
            var product, v, view;
            product = this.products.detect(function(p) { return p.get('id') == (id); })
            view = ((v = this.views)['item.' + id]) || (v['item.' + id] = (
                new ProductView({model: product, 
                                 itemcollection: this.cart}).render()));
            $.when(this.hideAllViews()).then(
                function() { view.show(); });
        }
    });

    $(document).ready(function() {
        new BackboneStore();
        Backbone.history.start();
    });

}).call(this);

//this area is for search box using filter.js




