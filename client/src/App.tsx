
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { 
  Cake, 
  CreateOrderInput, 
  CreateCustomCakeRequestInput, 
  OrderWithItems, 
  CustomCakeRequest,
  CreateCakeInput,
  UpdateOrderStatusInput,
  UpdateCustomCakeRequestInput
} from '../../server/src/schema';

interface CartItem {
  cake: Cake;
  quantity: number;
}

function App() {
  // State management
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomCakeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('catalog');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [orderForm, setOrderForm] = useState<Omit<CreateOrderInput, 'items'>>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    notes: null
  });

  const [customCakeForm, setCustomCakeForm] = useState<CreateCustomCakeRequestInput>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    cake_description: '',
    occasion: null,
    size: null,
    flavor_preferences: null,
    design_preferences: null,
    budget_range: null,
    required_date: null
  });

  const [adminCakeForm, setAdminCakeForm] = useState<CreateCakeInput>({
    name: '',
    description: '',
    image_url: null,
    price: 0,
    category: '',
    is_available: true
  });

  // Load data functions
  const loadCakes = useCallback(async () => {
    try {
      const result = await trpc.getCakes.query();
      setCakes(result);
    } catch (error) {
      console.error('Failed to load cakes:', error);
      showMessage('error', 'Failed to load cakes');
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCakeCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const result = await trpc.getOrders.query();
      setOrders(result);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  }, []);

  const loadCustomRequests = useCallback(async () => {
    try {
      const result = await trpc.getCustomCakeRequests.query();
      setCustomRequests(result);
    } catch (error) {
      console.error('Failed to load custom requests:', error);
    }
  }, []);

  useEffect(() => {
    loadCakes();
    loadCategories();
  }, [loadCakes, loadCategories]);

  useEffect(() => {
    if (activeTab === 'admin') {
      loadOrders();
      loadCustomRequests();
    }
  }, [activeTab, loadOrders, loadCustomRequests]);

  // Utility functions
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const filteredCakes = selectedCategory === 'all' 
    ? cakes.filter((cake: Cake) => cake.is_available)
    : cakes.filter((cake: Cake) => cake.category === selectedCategory && cake.is_available);

  const cartTotal = cart.reduce((total: number, item: CartItem) => total + (item.cake.price * item.quantity), 0);

  // Cart functions
  const addToCart = (cake: Cake) => {
    setCart((prev: CartItem[]) => {
      const existing = prev.find((item: CartItem) => item.cake.id === cake.id);
      if (existing) {
        return prev.map((item: CartItem) => 
          item.cake.id === cake.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { cake, quantity: 1 }];
    });
    showMessage('success', `${cake.name} added to cart! 🎂`);
  };

  const updateCartQuantity = (cakeId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cakeId);
      return;
    }
    setCart((prev: CartItem[]) => 
      prev.map((item: CartItem) => 
        item.cake.id === cakeId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (cakeId: number) => {
    setCart((prev: CartItem[]) => prev.filter((item: CartItem) => item.cake.id !== cakeId));
  };

  // Order submission
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showMessage('error', 'Please add items to your cart first');
      return;
    }

    setIsLoading(true);
    try {
      const orderData: CreateOrderInput = {
        ...orderForm,
        items: cart.map((item: CartItem) => ({
          cake_id: item.cake.id,
          quantity: item.quantity
        }))
      };

      await trpc.createOrder.mutate(orderData);
      
      // Reset form and cart
      setOrderForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        delivery_address: '',
        notes: null
      });
      setCart([]);
      showMessage('success', 'Order placed successfully! We will contact you soon. 🎉');
    } catch (error) {
      console.error('Failed to create order:', error);
      showMessage('error', 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Custom cake request submission
  const handleCustomCakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createCustomCakeRequest.mutate(customCakeForm);
      
      // Reset form
      setCustomCakeForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        cake_description: '',
        occasion: null,
        size: null,
        flavor_preferences: null,
        design_preferences: null,
        budget_range: null,
        required_date: null
      });
      showMessage('success', 'Custom cake request submitted! We will review and contact you soon. ✨');
    } catch (error) {
      console.error('Failed to create custom cake request:', error);
      showMessage('error', 'Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Admin functions
  const handleCreateCake = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCake = await trpc.createCake.mutate(adminCakeForm);
      setCakes((prev: Cake[]) => [...prev, newCake]);
      setAdminCakeForm({
        name: '',
        description: '',
        image_url: null,
        price: 0,
        category: '',
        is_available: true
      });
      showMessage('success', 'Cake created successfully!');
    } catch (error) {
      console.error('Failed to create cake:', error);
      showMessage('error', 'Failed to create cake');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: UpdateOrderStatusInput['status']) => {
    try {
      await trpc.updateOrderStatus.mutate({ id: orderId, status });
      setOrders((prev: OrderWithItems[]) => 
        prev.map((order: OrderWithItems) => 
          order.id === orderId ? { ...order, status } : order
        )
      );
      showMessage('success', 'Order status updated');
    } catch (error) {
      console.error('Failed to update order status:', error);
      showMessage('error', 'Failed to update order status');
    }
  };

  const handleUpdateCustomRequestStatus = async (requestId: number, status: UpdateCustomCakeRequestInput['status'], quotedPrice?: number) => {
    try {
      const updateData: UpdateCustomCakeRequestInput = {
        id: requestId,
        status,
        ...(quotedPrice && { quoted_price: quotedPrice })
      };
      await trpc.updateCustomCakeRequest.mutate(updateData);
      setCustomRequests((prev: CustomCakeRequest[]) => 
        prev.map((request: CustomCakeRequest) => 
          request.id === requestId 
            ? { ...request, status, ...(quotedPrice && { quoted_price: quotedPrice }) }
            : request
        )
      );
      showMessage('success', 'Request status updated');
    } catch (error) {
      console.error('Failed to update request status:', error);
      showMessage('error', 'Failed to update request status');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-pink-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-pink-800">🎂 Sweet Dreams Bakery</h1>
              <p className="text-pink-600">Nairobi's Finest Custom Cakes</p>
            </div>
            <div className="flex items-center space-x-4">
              {cart.length > 0 && (
                <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                  Cart: {cart.length} items
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Message Alert */}
      {message && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="catalog">🍰 Cake Catalog</TabsTrigger>
            <TabsTrigger value="order">🛒 Place Order</TabsTrigger>
            <TabsTrigger value="custom">✨ Custom Cakes</TabsTrigger>
            <TabsTrigger value="admin">👩‍💼 Admin</TabsTrigger>
          </TabsList>

          {/* Cake Catalog */}
          <TabsContent value="catalog" className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <Label>Filter by Category:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: string) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCakes.map((cake: Cake) => (
                <Card key={cake.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {cake.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={cake.image_url} 
                        alt={cake.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{cake.name}</CardTitle>
                      <Badge className="bg-pink-100 text-pink-800">{cake.category}</Badge>
                    </div>
                    <CardDescription>{cake.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-pink-700">
                      KSh {cake.price.toLocaleString()}
                    </span>
                    <Button 
                      onClick={() => addToCart(cake)}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      Add to Cart 🛒
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {filteredCakes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No cakes available in this category.</p>
              </div>
            )}
          </TabsContent>

          {/* Order Page */}
          <TabsContent value="order" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Cart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🛒 Your Cart
                    {cart.length > 0 && (
                      <Badge variant="secondary">{cart.length} items</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Your cart is empty. Add some delicious cakes! 🎂
                    </p>
                  ) : (
                    <>
                      {cart.map((item: CartItem) => (
                        <div key={item.cake.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.cake.name}</h4>
                            <p className="text-sm text-gray-600">KSh {item.cake.price.toLocaleString()} each</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.cake.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.cake.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFromCart(item.cake.id)}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-pink-700">KSh {cartTotal.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Order Form */}
              <Card>
                <CardHeader>
                  <CardTitle>📝 Order Details</CardTitle>
                  <CardDescription>Please provide your details for delivery</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleOrderSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="customer_name">Full Name *</Label>
                      <Input
                        id="customer_name"
                        value={orderForm.customer_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setOrderForm((prev: typeof orderForm) => ({ ...prev, customer_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_email">Email Address *</Label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={orderForm.customer_email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setOrderForm((prev: typeof orderForm) => ({ ...prev, customer_email: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_phone">Phone Number *</Label>
                      <Input
                        id="customer_phone"
                        value={orderForm.customer_phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setOrderForm((prev: typeof orderForm) => ({ ...prev, customer_phone: e.target.value }))
                        }
                        placeholder="e.g., +254 700 123 456"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery_address">Delivery Address *</Label>
                      <Textarea
                        id="delivery_address"
                        value={orderForm.delivery_address}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setOrderForm((prev: typeof orderForm) => ({ ...prev, delivery_address: e.target.value }))
                        }
                        placeholder="Please provide complete address with landmarks"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Special Instructions (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={orderForm.notes || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setOrderForm((prev: typeof orderForm) => ({ 
                            ...prev, 
                            notes: e.target.value || null 
                          }))
                        }
                        placeholder="Any special requests or delivery instructions"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoading || cart.length === 0}
                      className="w-full bg-pink-600 hover:bg-pink-700"
                    >
                      {isLoading ? 'Placing Order...' : `Place Order - KSh ${cartTotal.toLocaleString()}`} 🎂
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Custom Cake Requests */}
          <TabsContent value="custom" className="space-y-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">✨ Custom Cake Request</CardTitle>
                <CardDescription>
                  Tell us about your dream cake and we'll make it happen! 
                  Perfect for weddings, birthdays, and special occasions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCustomCakeSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="custom_customer_name">Full Name *</Label>
                      <Input
                        id="custom_customer_name"
                        value={customCakeForm.customer_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCustomCakeForm((prev: CreateCustomCakeRequestInput) => ({ 
                            ...prev, customer_name: e.target.value 
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom_customer_phone">Phone Number *</Label>
                      <Input
                        id="custom_customer_phone"
                        value={customCakeForm.customer_phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCustomCakeForm((prev: CreateCustomCakeRequestInput) => ({ 
                            ...prev, customer_phone: e.target.value 
                          }))
                        }
                        placeholder="e.g., +254 700 123 456"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="custom_customer_email">Email Address *</Label>
                    <Input
                      id="custom_customer_email"
                      type="email"
                      value={customCakeForm.customer_email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCustomCakeForm((prev: CreateCustomCakeRequestInput) => ({ 
                          ...prev, customer_email: e.target.value 
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cake_description">Describe Your Dream Cake *</Label>
                    <Textarea
                      id="cake_description"
                      value={customCakeForm.cake_description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCustomCakeForm((prev: CreateCustomCakeRequestInput) => ({ 
                          ...prev, cake_description: e.target.value 
                        }))
                      }
                      placeholder="Please describe your ideal cake in detail - theme, colors, decorations, etc."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="occasion">Occasion</Label>
                      <Input
                        id="occasion"
                        value={customCakeForm.occasion || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCustomCakeForm((prev: CreateCustomCakeRequestInput) => ({ 
                            ...prev, occasion: e.target.value || null 
                          }))
                        }
                        placeholder="e.g., Wedding, Birthday, Anniversary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="size">Size</Label>
                      <Select 
                        value={customCakeForm.size || 'not-specified'} 
                        onValueChange={(value: string) =>
                          setCustomCakeForm((prev: CreateCustomCakeRequestInput) => ({ 
                            ...prev, size: value === 'not-specified' ? null : value 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not-specified">Not specified</SelectItem>
                          <SelectItem value="small">Small (6-8 people)</SelectItem>
                          <SelectItem value="medium">Medium (10-15 people)</SelectItem>
                          <SelectItem value="large">Large (20-30 people)</SelectItem>
                          <SelectItem value="extra-large">Extra Large (40+ people)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="flavor_preferences">Flavor Preferences</Label>
                    <Input
                      id="flavor_preferences"
                      value={customCakeForm.flavor_preferences || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCustomCakeForm((prev: CreateCustomCakeRequestInput) => ({ 
                          ...prev, flavor_preferences: e.target.value || null 
                        }))
                      }
                      placeholder="e.g., Vanilla, Chocolate, Red Velvet, Lemon"
                    />
                  </div>

                  <div>
                    <Label htmlFor="design_preferences">Design Preferences</Label>
                    <Textarea
                      id="design_preferences"
                      value={customCakeForm.design_preferences || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCustomCakeForm((prev: CreateCustomCakeRequestInput) => ({ 
                          ...prev, design_preferences: e.target.value || null 
                        }))
                      }
                      placeholder="Colors, decorations, themes, inspiration photos, etc."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget_range">Budget Range (KSh)</Label>
                      <Select 
                        value={customCakeForm.budget_range || 'not-specified'} 
                        onValueChange={(value: string) =>
                          setCustomCakeForm((prev: CreateCustomCakeRequestInput) => ({ 
                            ...prev, budget_range: value === 'not-specified' ? null : value 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not-specified">Not specified</SelectItem>
                          <SelectItem value="under-5000">Under KSh 5,000</SelectItem>
                          <SelectItem value="5000-10000">KSh 5,000 - 10,000</SelectItem>
                          <SelectItem value="10000-20000">KSh 10,000 - 20,000</SelectItem>
                          <SelectItem value="20000-50000">KSh 20,000 - 50,000</SelectItem>
                          <SelectItem value="over-50000">Over KSh 50,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="required_date">Required Date</Label>
                      <Input
                        id="required_date"
                        type="date"
                        value={customCakeForm.required_date ? new Date(customCakeForm.required_date).toISOString().split('T')[0] : ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCustomCakeForm((prev: CreateCustomCakeRequestInput) => ({ 
                            ...prev, required_date: e.target.value ? new Date(e.target.value) : null 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  >
                    {isLoading ? 'Submitting Request...' : 'Submit Custom Cake Request'} ✨
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Interface */}
          <TabsContent value="admin" className="space-y-6">
            <Tabs defaultValue="manage-cakes">
              <TabsList>
                <TabsTrigger value="manage-cakes">Manage Cakes</TabsTrigger>
                <TabsTrigger value="view-orders">View Orders</TabsTrigger>
                <TabsTrigger value="custom-requests">Custom Requests</TabsTrigger>
              </TabsList>

              {/* Manage Cakes */}
              <TabsContent value="manage-cakes" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Cake</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateCake} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="admin_cake_name">Cake Name *</Label>
                        <Input
                          id="admin_cake_name"
                          value={adminCakeForm.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAdminCakeForm((prev: CreateCakeInput) => ({ ...prev, name: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="admin_cake_category">Category *</Label>
                        <Input
                          id="admin_cake_category"
                          value={adminCakeForm.category}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAdminCakeForm((prev: CreateCakeInput) => ({ ...prev,category: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="admin_cake_price">Price (KSh) *</Label>
                        <Input
                          id="admin_cake_price"
                          type="number"
                          value={adminCakeForm.price}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAdminCakeForm((prev: CreateCakeInput) => ({ 
                              ...prev, price: parseFloat(e.target.value) || 0 
                            }))
                          }
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="admin_cake_image">Image URL</Label>
                        <Input
                          id="admin_cake_image"
                          type="url"
                          value={adminCakeForm.image_url || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAdminCakeForm((prev: CreateCakeInput) => ({ 
                              ...prev, image_url: e.target.value || null 
                            }))
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="admin_cake_description">Description *</Label>
                        <Textarea
                          id="admin_cake_description"
                          value={adminCakeForm.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setAdminCakeForm((prev: CreateCakeInput) => ({ ...prev, description: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Creating...' : 'Create Cake'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Existing Cakes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Existing Cakes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {cakes.map((cake: Cake) => (
                        <div key={cake.id} className="flex items-center justify-between p-4 border rounded">
                          <div>
                            <h4 className="font-semibold">{cake.name}</h4>
                            <p className="text-sm text-gray-600">{cake.category} - KSh {cake.price.toLocaleString()}</p>
                            <Badge variant={cake.is_available ? "default" : "secondary"}>
                              {cake.is_available ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* View Orders */}
              <TabsContent value="view-orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order: OrderWithItems) => (
                          <TableRow key={order.id}>
                            <TableCell>#{order.id}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.customer_name}</div>
                                <div className="text-sm text-gray-600">{order.customer_email}</div>
                                <div className="text-sm text-gray-600">{order.customer_phone}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {order.items.map((item) => (
                                <div key={item.id} className="text-sm">
                                  {item.cake_name} × {item.quantity}
                                </div>
                              ))}
                            </TableCell>
                            <TableCell>KSh {order.total_amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={
                                order.status === 'delivered' ? 'default' :
                                order.status === 'cancelled' ? 'destructive' : 'secondary'
                              }>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{order.created_at.toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Select 
                                value={order.status} 
                                onValueChange={(status: UpdateOrderStatusInput['status']) => 
                                  handleUpdateOrderStatus(order.id, status)
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="preparing">Preparing</SelectItem>
                                  <SelectItem value="ready">Ready</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {orders.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No orders yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Custom Requests */}
              <TabsContent value="custom-requests">
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Cake Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customRequests.map((request: CustomCakeRequest) => (
                        <Card key={request.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">Request #{request.id}</CardTitle>
                                <CardDescription>
                                  {request.customer_name} • {request.customer_email} • {request.customer_phone}
                                </CardDescription>
                              </div>
                              <Badge variant={
                                request.status === 'completed' ? 'default' :
                                request.status === 'cancelled' ? 'destructive' : 'secondary'
                              }>
                                {request.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="font-semibold">Cake Description:</h4>
                              <p className="text-sm">{request.cake_description}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {request.occasion && (
                                <div>
                                  <span className="font-semibold">Occasion:</span> {request.occasion}
                                </div>
                              )}
                              {request.size && (
                                <div>
                                  <span className="font-semibold">Size:</span> {request.size}
                                </div>
                              )}
                              {request.flavor_preferences && (
                                <div>
                                  <span className="font-semibold">Flavors:</span> {request.flavor_preferences}
                                </div>
                              )}
                              {request.budget_range && (
                                <div>
                                  <span className="font-semibold">Budget:</span> {request.budget_range}
                                </div>
                              )}
                              {request.required_date && (
                                <div>
                                  <span className="font-semibold">Required Date:</span> {request.required_date.toLocaleDateString()}
                                </div>
                              )}
                              {request.quoted_price && (
                                <div>
                                  <span className="font-semibold">Quoted Price:</span> KSh {request.quoted_price.toLocaleString()}
                                </div>
                              )}
                            </div>

                            {request.design_preferences && (
                              <div>
                                <h4 className="font-semibold">Design Preferences:</h4>
                                <p className="text-sm">{request.design_preferences}</p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Select 
                                value={request.status} 
                                onValueChange={(status: UpdateCustomCakeRequestInput['status']) => 
                                  handleUpdateCustomRequestStatus(request.id, status)
                                }
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="reviewed">Reviewed</SelectItem>
                                  <SelectItem value="quoted">Quoted</SelectItem>
                                  <SelectItem value="approved">Approved</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>

                              {request.status === 'reviewed' && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">Add Quote</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Add Quote</DialogTitle>
                                      <DialogDescription>
                                        Set a quoted price for this custom cake request.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="quote_price">Quoted Price (KSh)</Label>
                                        <Input
                                          id="quote_price"
                                          type="number"
                                          placeholder="Enter quoted price"
                                          min="0"
                                          step="0.01"
                                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === 'Enter') {
                                              const price = parseFloat((e.target as HTMLInputElement).value);
                                              if (price > 0) {
                                                handleUpdateCustomRequestStatus(request.id, 'quoted', price);
                                              }
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button 
                                        onClick={() => {
                                          const input = document.getElementById('quote_price') as HTMLInputElement;
                                          const price = parseFloat(input.value);
                                          if (price > 0) {
                                            handleUpdateCustomRequestStatus(request.id, 'quoted', price);
                                          }
                                        }}
                                      >
                                        Submit Quote
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {customRequests.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No custom cake requests yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <h3 className="text-lg font-semibold text-pink-800 mb-2">🎂 Sweet Dreams Bakery</h3>
            <p>Creating sweet memories, one cake at a time</p>
            <p className="text-sm mt-2">Nairobi, Kenya | Call us: +254 700 123 456</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
