
import React, { useState, useRef, useEffect } from 'react';
import { 
  Utensils, 
  History as HistoryIcon, 
  RefreshCcw, 
  ChefHat, 
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Zap,
  BookOpen,
  X,
  Clock,
  CheckCircle2,
  Camera,
  Upload,
  Image as ImageIcon,
  Bookmark,
  BookmarkCheck,
  Share2,
  Download,
  Plus,
  Trash2,
  Heart,
  Search,
  Compass,
  LayoutGrid,
  Bell,
  ChevronDown,
  MapPin,
  Star,
  MessageSquare
} from 'lucide-react';
import { AppState, UserPreferences, Recommendation, Mood, Budget, Cuisine, TabType, Category, TimePreference, IngredientPreference, Restaurant, DishRating } from './types';
import { getFoodRecommendation, generateFoodImage, getDetailedRecipe, analyzeDishImage, selectRecipeFromPool, selectRestaurantFromPool } from './geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { QRCodeCanvas } from 'qrcode.react';

// Use a persistent chefId for the user
const getChefId = () => {
  let id = localStorage.getItem('foodie_chef_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 10);
    localStorage.setItem('foodie_chef_id', id);
  }
  return id;
};

const SAMPLE_RECIPES: Recommendation[] = [
  {
    id: 'sample-1',
    name: '秘制红烧肉',
    category: Category.MEAT,
    description: '肥而不腻，入口即化，经典的本帮风味，每一口都是满满的幸福感。',
    reason: '这是最能温暖人心的经典味道',
    tags: ['经典', '下饭', '浓油赤酱'],
    calories: '650 kcal',
    prepTime: '45分钟',
    difficulty: '中等',
    funFact: '苏东坡不仅是伟大的诗人，也是红烧肉的忠实推广者。',
    imageUrl: 'https://picsum.photos/seed/pork/800/600',
    recipe: {
      ingredients: [
        { item: '五花肉', amount: '500g' },
        { item: '冰糖', amount: '30g' },
        { item: '生抽/老抽', amount: '各2勺' },
        { item: '生姜/八角', amount: '适量' }
      ],
      steps: [
        '五花肉切块焯水备用。',
        '锅内放少许油，下冰糖炒出糖色。',
        '放入肉块翻炒上色，加入姜片、八角。',
        '加入调料和热水，小火焖煮45分钟，最后大火收汁。'
      ],
      tips: ['一定要用热水焖煮，肉质才不会柴。', '收汁阶段要不停翻炒防止糊锅。']
    }
  },
  {
    id: 'sample-2',
    name: '泰式青咖喱鸡',
    category: Category.MEAT,
    description: '椰香浓郁，辛辣爽口，青柠与罗勒的香气交织出地道的南洋风情。',
    reason: '清爽的辣味能瞬间唤醒疲惫的味蕾',
    tags: ['异域', '微辣', '椰香'],
    calories: '480 kcal',
    prepTime: '30分钟',
    difficulty: '中等',
    funFact: '青咖喱的绿色主要来自于新鲜的青辣椒。',
    imageUrl: 'https://picsum.photos/seed/curry/800/600',
    recipe: {
      ingredients: [
        { item: '鸡腿肉', amount: '300g' },
        { item: '青咖喱酱', amount: '50g' },
        { item: '椰浆', amount: '200ml' },
        { item: '各种蔬菜', amount: '适量' }
      ],
      steps: [
        '锅中倒入少许椰浆，炒香青咖喱酱。',
        '放入鸡肉块翻炒至变色。',
        '倒入剩余椰浆和蔬菜，中小火煮熟。',
        '最后撒上九层塔叶即可出锅。'
      ],
      tips: ['椰浆不要一次性倒完，分次加入香味更浓。']
    }
  },
  {
    id: 'sample-3',
    name: '清炒时蔬',
    category: Category.VEGETABLE,
    description: '时令鲜蔬，清甜爽口，保留了食材最原始的鲜美。',
    reason: '清淡饮食，给肠胃放个假',
    tags: ['健康', '清淡', '快手'],
    calories: '120 kcal',
    prepTime: '10分钟',
    difficulty: '简单',
    funFact: '大火快炒是保持蔬菜翠绿和营养的关键。',
    imageUrl: 'https://picsum.photos/seed/veg/800/600',
    recipe: {
      ingredients: [
        { item: '时令蔬菜', amount: '300g' },
        { item: '大蒜', amount: '3瓣' },
        { item: '盐', amount: '适量' }
      ],
      steps: [
        '蔬菜洗净切段，大蒜切末。',
        '热锅凉油，下蒜末爆香。',
        '放入蔬菜大火快炒至断生。',
        '加盐调味即可出锅。'
      ],
      tips: ['炒叶菜类一定要大火，防止出水过多。']
    }
  },
  {
    id: 'sample-4',
    name: '黑松露奶油培根面',
    category: Category.STAPLE,
    description: '奶油的醇厚与黑松露的独特幽香完美融合，是极致的味蕾享受。',
    reason: '偶尔也需要一点奢华的仪式感',
    tags: ['高级', '奶油', '快手'],
    calories: '550 kcal',
    prepTime: '15分钟',
    difficulty: '简单',
    funFact: '松露曾被古希腊人认为是“雷电击中大地”而产生的。',
    imageUrl: 'https://picsum.photos/seed/pasta/800/600',
    recipe: {
      ingredients: [
        { item: '意面', amount: '100g' },
        { item: '淡奶油', amount: '150ml' },
        { item: '培根', amount: '2片' },
        { item: '黑松露酱', amount: '1勺' }
      ],
      steps: [
        '意面按包装说明煮熟捞出。',
        '培根切碎煎至焦香。',
        '倒入淡奶油小火煮至浓稠。',
        '放入意面和黑松露酱，快速拌匀即可。'
      ],
      tips: ['黑松露酱最后放，能最大程度保留香气。']
    }
  }
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'start',
    activeTab: 'recommend',
    preferences: {
      mood: Mood.HAPPY,
      budget: Budget.MEDIUM,
      cuisine: Cuisine.ANY,
      time: TimePreference.ANY,
      ingredient: IngredientPreference.ANY,
      restrictions: '',
      location: '在家'
    },
    recommendation: null,
    history: [],
    savedRecipes: [],
    restaurants: [],
    isRecipeModalOpen: false,
    isFetchingRecipe: false,
    isShareModalOpen: false
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Partial<Restaurant> | null>(null);
  const [manualRecipeImage, setManualRecipeImage] = useState<string | null>(null);
  const [isFullMenuShareModalOpen, setIsFullMenuShareModalOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [chefId, setChefId] = useState(getChefId());
  const [targetChefId, setTargetChefId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(new Set(Object.values(Category)));
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<Category>(Category.MEAT);
  const [restaurantFilter, setRestaurantFilter] = useState<'want_to_go' | 'visited'>('want_to_go');
  const [resCuisineFilter, setResCuisineFilter] = useState<string>('全部');
  const [resLocationFilter, setResLocationFilter] = useState<string>('全部');
  const [resDistanceFilter, setResDistanceFilter] = useState<number | null>(null);
  const [resRatingFilter, setResRatingFilter] = useState<number | null>(null);
  const [resPriceFilter, setResPriceFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef<Socket | null>(null);

  const toggleCategory = (cat: Category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const uniqueLocations = Array.from(new Set(['在家', ...state.restaurants.map(r => r.location).filter(Boolean)]));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const guestChefId = params.get('chefId');
    if (guestChefId && guestChefId !== chefId) {
      setIsGuest(true);
      setTargetChefId(guestChefId);
      // Fetch the chef's menu and restaurants
      fetch(`/api/menu/${guestChefId}`)
        .then(res => {
          if (!res.ok) throw new Error('Data not found');
          return res.json();
        })
        .then(data => {
          setState(prev => ({ 
            ...prev, 
            savedRecipes: data.savedRecipes || prev.savedRecipes, 
            restaurants: data.restaurants || prev.restaurants,
            activeTab: 'menu' 
          }));
        })
        .catch(err => console.error('Error fetching data:', err));
    }

    // Socket setup
    try {
      socketRef.current = io();
      
      if (guestChefId && guestChefId !== chefId) {
        // Guest doesn't need to register as chef
      } else {
        socketRef.current.emit('register-chef', chefId);
      }

      socketRef.current.on('new-order', (order) => {
        setOrders(prev => [order, ...prev]);
        // Show a simple browser notification if possible
        if (Notification.permission === 'granted') {
          new Notification('新订单！', { body: `有人下单了：${order.name}` });
        }
      });

      socketRef.current.on('connect_error', () => {
        console.warn('Socket connection failed. Real-time features may be unavailable.');
      });
    } catch (e) {
      console.error('Socket initialization failed:', e);
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [chefId]);

  useEffect(() => {
    if (!isGuest) {
      // Save data to server whenever it changes so guests can see it
      fetch(`/api/menu/${chefId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          savedRecipes: state.savedRecipes,
          restaurants: state.restaurants
        })
      }).catch(err => console.error('Error saving data:', err));
    }
  }, [state.savedRecipes, state.restaurants, chefId, isGuest]);
  const [newRecipe, setNewRecipe] = useState<Partial<Recommendation>>({
    name: '',
    category: Category.MEAT,
    description: '',
    tags: [],
    calories: '300-500 kcal',
    funFact: '',
    recipe: {
      ingredients: [{ item: '', amount: '' }],
      steps: [''],
      tips: ['']
    }
  });

  useEffect(() => {
    const savedRecipes = localStorage.getItem('foodie_saved_recipes');
    const savedRestaurants = localStorage.getItem('foodie_restaurants');
    
    let parsedRecipes: Recommendation[] = [];
    let parsedRestaurants: Restaurant[] = [];

    if (savedRecipes) {
      try {
        parsedRecipes = JSON.parse(savedRecipes);
      } catch (e) {
        console.error("Failed to load saved recipes");
      }
    }

    if (savedRestaurants) {
      try {
        parsedRestaurants = JSON.parse(savedRestaurants);
      } catch (e) {
        console.error("Failed to load saved restaurants");
      }
    }

    setState(prev => ({ 
      ...prev, 
      savedRecipes: parsedRecipes.length > 0 ? parsedRecipes : SAMPLE_RECIPES, 
      restaurants: parsedRestaurants 
    }));
  }, []);

  useEffect(() => {
    localStorage.setItem('foodie_saved_recipes', JSON.stringify(state.savedRecipes));
    localStorage.setItem('foodie_restaurants', JSON.stringify(state.restaurants));
  }, [state.savedRecipes, state.restaurants]);

  const [loadingText, setLoadingText] = useState('正在同步您的味蕾偏好...');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  const handleStartMatch = () => {
    if (state.savedRecipes.length === 0 && state.restaurants.length === 0) {
      alert("您的私人菜单和餐馆列表都是空的，请先添加内容！");
      return;
    }
    setState(prev => ({ ...prev, step: 'questions' }));
  };

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value }
    }));
  };

  const handleSearchMenu = async () => {
    if (state.savedRecipes.length === 0) {
      alert("您的私人菜单还是空的！");
      return;
    }
    setState(prev => ({ ...prev, step: 'loading' }));
    setLoadingText('正在查阅您的私人菜单...');
    const messages = ['评估哪道菜最适合当下的你...', '对比营养与口味...', '准备呈上佳肴...'];
    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingText(messages[msgIndex]);
    }, 1500);

    try {
      const { selectedId, reason } = await selectRecipeFromPool(state.preferences, state.savedRecipes);
      const selected = state.savedRecipes.find(r => r.id === selectedId) || state.savedRecipes[0];
      const recWithReason = { ...selected, reason: reason || "这是您菜单中最符合当前心情的选择" };
      setState(prev => ({
        ...prev,
        step: 'result',
        recommendation: recWithReason,
        history: [recWithReason, ...prev.history].slice(0, 10)
      }));
    } catch (error) {
      console.error(error);
      alert('匹配失败，请稍后再试');
      setState(prev => ({ ...prev, step: 'start' }));
    } finally {
      clearInterval(interval);
    }
  };

  const handleSearchRestaurant = async () => {
    const locationPool = state.restaurants.filter(r => r.location === state.preferences.location);
    if (locationPool.length === 0) {
      alert(`您在 ${state.preferences.location} 还没有添加过餐馆！`);
      return;
    }
    setState(prev => ({ ...prev, step: 'loading' }));
    setLoadingText('正在搜索附近的宝藏店铺...');
    const messages = ['对比评分与口碑...', '为您挑选最合适的餐厅...', '准备出发...'];
    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingText(messages[msgIndex]);
    }, 1500);

    try {
      const { selectedId, reason } = await selectRestaurantFromPool(state.preferences, locationPool);
      const random = state.restaurants.find(r => r.id === selectedId) || locationPool[0];
      const rec = {
        id: random.id,
        name: random.name,
        description: random.notes || `一家主打${random.cuisine}的餐厅。`,
        reason: reason || '根据您的口味，今天去这家餐厅坐坐吧！',
        tags: [random.cuisine, random.status === 'visited' ? '去过' : '想去'],
        calories: '--',
        funFact: '去探索新的美味也是一种修行。',
        imageUrl: random.imageUrl || `https://picsum.photos/seed/${random.name}/800/600`
      };
      setState(prev => ({ 
        ...prev, 
        step: 'result', 
        recommendation: rec,
        history: [rec, ...prev.history].slice(0, 10)
      }));
    } catch (error) {
      console.error(error);
      alert('匹配失败，请稍后再试');
      setState(prev => ({ ...prev, step: 'start' }));
    } finally {
      clearInterval(interval);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      const mimeType = file.type;
      const base64Content = base64Data.split(',')[1];

      setState(prev => ({ ...prev, step: 'upload_loading' }));
      setLoadingText('正在识别您的拿手好菜...');
      const interval = setInterval(() => {
        const msgs = ['分析图像...', '解析秘诀...', '收录菜谱...'];
        setLoadingText(msgs[Math.floor(Math.random() * msgs.length)]);
      }, 2000);

      try {
        const result = await analyzeDishImage(base64Content, mimeType);
        result.imageUrl = base64Data;
        
        setState(prev => ({
          ...prev,
          step: 'result',
          recommendation: result,
          savedRecipes: [result, ...prev.savedRecipes],
          history: [result, ...prev.history].slice(0, 10)
        }));
      } catch (error) {
        alert('识别失败！');
        setState(prev => ({ ...prev, step: 'start' }));
      } finally {
        clearInterval(interval);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShowDetails = async () => {
    if (!state.recommendation) return;
    
    // Check if it's a restaurant
    const restaurant = state.restaurants.find(r => r.id === state.recommendation?.id);
    if (restaurant) {
      setEditingRestaurant(restaurant);
      setIsRestaurantModalOpen(true);
      return;
    }

    if (state.recommendation.recipe) {
      setState(prev => ({ ...prev, isRecipeModalOpen: true }));
      return;
    }
    setState(prev => ({ ...prev, isFetchingRecipe: true }));
    try {
      const recipe = await getDetailedRecipe(state.recommendation.name);
      const updatedRec = { ...state.recommendation, recipe };
      setState(prev => ({
        ...prev,
        recommendation: updatedRec,
        isRecipeModalOpen: true,
        history: prev.history.map(h => h.id === updatedRec.id ? updatedRec : h)
      }));
    } catch (error) {
      alert('获取失败');
    } finally {
      setState(prev => ({ ...prev, isFetchingRecipe: false }));
    }
  };

  const toggleSaveRecipe = (rec: Recommendation) => {
    const isSaved = state.savedRecipes.some(r => r.id === rec.id);
    if (isSaved) {
      setState(prev => ({ ...prev, savedRecipes: prev.savedRecipes.filter(r => r.id !== rec.id) }));
    } else {
      setState(prev => ({ ...prev, savedRecipes: [rec, ...prev.savedRecipes] }));
    }
  };

  const setActiveTab = (tab: TabType) => {
    setState(prev => ({ ...prev, activeTab: tab, step: tab === 'recommend' ? 'start' : 'start' }));
  };

  const isCurrentSaved = state.recommendation ? state.savedRecipes.some(r => r.id === state.recommendation?.id) : false;

  const handleAddVisit = (restaurantId: string) => {
    setState(prev => ({
      ...prev,
      restaurants: prev.restaurants.map(r => {
        if (r.id === restaurantId) {
          const now = new Date().toISOString();
          return {
            ...r,
            visitCount: (r.visitCount || 0) + 1,
            visitHistory: [now, ...(r.visitHistory || [])]
          };
        }
        return r;
      })
    }));
  };

  const renderRestaurantCard = (res: Restaurant, i: number) => (
    <motion.div 
      key={res.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-orange-100/50 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
            <img src={res.imageUrl || `https://picsum.photos/seed/${res.name}/200/200`} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-serif-menu text-lg font-bold text-stone-800 truncate">{res.name}</h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest bg-stone-100 px-1.5 py-0.5 rounded-md">{res.cuisine}</p>
                  <span className="text-[8px] text-stone-300">•</span>
                  <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">{res.location}</p>
                  <span className="text-[8px] text-stone-300">•</span>
                  <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">¥{res.avgPrice}/人</p>
                  {res.distance !== undefined && (
                    <>
                      <span className="text-[8px] text-stone-300">•</span>
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{res.distance}km</p>
                    </>
                  )}
                </div>
                {res.address && (
                  <button 
                    onClick={() => window.open(`https://www.amap.com/search?query=${encodeURIComponent(res.address!)}`, '_blank')}
                    className="flex items-center gap-1 text-[9px] text-stone-400 hover:text-orange-500 transition-colors group/addr"
                  >
                    <MapPin className="w-2.5 h-2.5 group-hover/addr:animate-bounce" />
                    <span className="truncate max-w-[150px]">{res.address}</span>
                  </button>
                )}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    setEditingRestaurant(res);
                    setIsRestaurantModalOpen(true);
                  }}
                  className="p-1.5 text-stone-300 hover:text-orange-500 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setState(prev => ({ ...prev, restaurants: prev.restaurants.filter(r => r.id !== res.id) }))}
                  className="p-1.5 text-stone-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {res.status === 'visited' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-stone-50/50 px-3 py-2 rounded-xl border border-stone-100/50">
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-2.5 h-2.5 ${i < (res.overallRating || 0) ? 'text-yellow-400 fill-current' : 'text-stone-200'}`} />
                  ))}
                </div>
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{res.overallRating}/5</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">已打卡 {res.visitCount || 1} 次</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddVisit(res.id);
                  }}
                  className="w-6 h-6 flex items-center justify-center bg-white text-orange-500 rounded-lg shadow-sm border border-orange-100 hover:bg-orange-500 hover:text-white transition-all active:scale-90"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {res.visitHistory && res.visitHistory.length > 0 && (
              <div className="flex flex-wrap gap-1 px-1">
                {res.visitHistory.slice(0, 4).map((date, di) => (
                  <div key={di} className="flex items-center gap-1 text-[8px] font-bold text-stone-400 bg-white border border-stone-100 px-2 py-0.5 rounded-md shadow-sm">
                    <Clock className="w-2 h-2 opacity-50" />
                    {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                ))}
                {res.visitHistory.length > 4 && <span className="text-[8px] font-bold text-stone-300 self-center ml-1">...</span>}
              </div>
            )}

            {res.dishRatings && res.dishRatings.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {res.dishRatings.map((dish, di) => (
                  <div key={di} className="bg-white p-2 rounded-xl border border-orange-100/30 flex gap-3 items-center shadow-sm">
                    {dish.imageUrl && (
                      <img src={dish.imageUrl} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-stone-800 truncate">{dish.name}</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, si) => (
                            <Star key={si} className={`w-2 h-2 ${si < dish.rating ? 'text-yellow-400 fill-current' : 'text-stone-200'}`} />
                          ))}
                        </div>
                      </div>
                      {dish.comment && (
                        <p className="text-[9px] text-stone-500 italic line-clamp-1 opacity-80">{dish.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {res.status === 'want_to_go' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-stone-100 text-stone-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">想吃清单</span>
              <div className="h-[1px] flex-1 bg-stone-50"></div>
            </div>
            {res.dishesToTry && res.dishesToTry.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {res.dishesToTry.map((dish, di) => (
                  <div key={di} className="flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100/50">
                    {dish.imageUrl && <img src={dish.imageUrl} className="w-4 h-4 rounded-sm object-cover" />}
                    <span className="text-[9px] font-bold text-orange-600">想吃: {dish.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-rose-50 flex flex-col items-center">
      {/* Dynamic Header */}
      <header className="w-full max-w-2xl px-6 pt-8 flex justify-between items-center z-30">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-gray-900 p-2.5 rounded-2xl shadow-2xl group-hover:bg-orange-500 transition-colors duration-500">
            <Utensils className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">今天吃什么</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Kitchen Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {orders.length > 0 && !isGuest && (
            <button 
              onClick={() => setState(prev => ({ ...prev, activeTab: 'menu' }))}
              className="relative bg-rose-500 text-white p-2.5 rounded-2xl shadow-xl animate-bounce hover:bg-rose-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-white text-rose-500 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-rose-500">
                {orders.length}
              </span>
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-2xl flex-1 flex flex-col p-6 pb-32">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

        <AnimatePresence mode="wait">
          {/* RECOMMEND TAB VIEW */}
          {state.activeTab === 'recommend' && (
            <motion.div key="explore-view" className="flex-1 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {state.step === 'start' && (
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-12">
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full flex items-center gap-2"
                  >
                    <Sparkles className="w-3 h-3 text-orange-500" />
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">今日主厨特选：秘制红烧肉</span>
                  </motion.div>

                  <div className="relative">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="w-32 h-32 bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex items-center justify-center border border-gray-50 relative z-10"
                    >
                      <ChefHat className="w-14 h-14 text-orange-500" />
                    </motion.div>
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute inset-0 bg-orange-100 blur-3xl -z-0 rounded-full"
                    />
                    <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-yellow-400 animate-pulse" />
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="font-serif-menu text-4xl md:text-6xl font-black text-gray-900 tracking-tight italic">今天吃什么？</h2>
                    <p className="text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase opacity-60">AI Flavor Inspiration Engine</p>
                  </div>

                  <div className="flex flex-col gap-6 w-full px-12">
                    <button 
                      onClick={handleStartMatch} 
                      className="w-full bg-gray-900 text-white py-6 rounded-full font-black text-lg shadow-2xl shadow-gray-200 flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-orange-600 group"
                    >
                      开始智慧匹配 
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </motion.div>
                    </button>
                    
                    {state.savedRecipes.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                          <div className="h-[1px] w-8 bg-gray-100"></div>
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Quick Suggestions</span>
                          <div className="h-[1px] w-8 bg-gray-100"></div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {state.savedRecipes.slice(0, 3).map((rec) => (
                            <button 
                              key={rec.id}
                              onClick={() => setState(prev => ({ ...prev, step: 'result', recommendation: rec }))}
                              className="px-4 py-2 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-500 hover:border-orange-200 hover:text-orange-500 transition-all shadow-sm"
                            >
                              {rec.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {state.step === 'questions' && (
                <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 shadow-2xl space-y-10 border border-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full -mr-20 -mt-20"></div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setState(prev => ({...prev, step: 'start'}))} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"><ArrowLeft className="w-5 h-5 text-gray-900" /></button>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">此刻的味蕾信号</h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Personal Flavor Profile</p>
                      </div>
                    </div>
                    <div className="bg-orange-500/10 px-3 py-1 rounded-full">
                      <span className="text-[10px] font-black text-orange-600">Step 1/2</span>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">你在哪里？</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uniqueLocations.map(loc => (
                        <button 
                          key={loc} 
                          onClick={() => updatePreference('location', loc)} 
                          className={`px-4 py-2.5 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-widest ${state.preferences.location === loc ? 'border-orange-500 bg-orange-500 text-white shadow-lg scale-105' : 'border-gray-50 bg-gray-50/50 text-gray-500 hover:border-orange-200'}`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-2">
                      <Heart className="w-3 h-3 text-rose-500" />
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">心情关键词</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.values(Mood).map(m => (
                        <button 
                          key={m} 
                          onClick={() => updatePreference('mood', m)} 
                          className={`px-4 py-4 rounded-2xl border-2 transition-all text-xs font-bold ${state.preferences.mood === m ? 'border-orange-500 bg-orange-500 text-white shadow-lg scale-105' : 'border-gray-50 bg-gray-50/50 text-gray-500 hover:border-orange-200'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-3 h-3 text-orange-500" />
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">想简餐还是大餐？</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.values(Budget).map(b => (
                        <button 
                          key={b} 
                          onClick={() => updatePreference('budget', b)} 
                          className={`px-4 py-4 rounded-2xl border-2 transition-all text-xs font-bold ${state.preferences.budget === b ? 'border-orange-500 bg-orange-500 text-white shadow-lg scale-105' : 'border-gray-50 bg-gray-50/50 text-gray-500 hover:border-orange-200'}`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-orange-500" />
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">时间预算</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(TimePreference).map(t => (
                        <button 
                          key={t} 
                          onClick={() => updatePreference('time', t)} 
                          className={`px-4 py-3 rounded-2xl border-2 transition-all text-xs font-bold ${state.preferences.time === t ? 'border-orange-500 bg-orange-500 text-white shadow-lg scale-105' : 'border-gray-50 bg-gray-50/50 text-gray-500 hover:border-orange-200'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-3 h-3 text-orange-500" />
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">主要食材</label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.values(IngredientPreference).map(i => (
                        <button 
                          key={i} 
                          onClick={() => updatePreference('ingredient', i)} 
                          className={`px-2 py-3 rounded-2xl border-2 transition-all text-[10px] font-bold ${state.preferences.ingredient === i ? 'border-orange-500 bg-orange-500 text-white shadow-lg scale-105' : 'border-gray-50 bg-gray-50/50 text-gray-500 hover:border-orange-200'}`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2">
                      <input 
                        type="text" 
                        placeholder="或者手动输入想吃的食材..." 
                        value={Object.values(IngredientPreference).includes(state.preferences.ingredient as any) ? '' : state.preferences.ingredient}
                        onChange={(e) => updatePreference('ingredient', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleSearchMenu} className="bg-gray-900 text-white py-5 rounded-[2rem] font-black text-sm shadow-xl shadow-gray-200 active:scale-95 hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
                        菜单搜寻 <Search className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (state.savedRecipes.length === 0) {
                            alert('您的菜单还是空的！');
                            return;
                          }
                          const random = state.savedRecipes[Math.floor(Math.random() * state.savedRecipes.length)];
                          setState(prev => ({ ...prev, step: 'result', recommendation: { ...random, reason: '随机推荐，给生活一点惊喜！' } }));
                        }} 
                        className="bg-orange-50 text-orange-600 py-5 rounded-[2rem] font-black text-sm shadow-sm active:scale-95 hover:bg-orange-100 transition-all flex items-center justify-center gap-2"
                      >
                        随机菜单 <RefreshCcw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleSearchRestaurant} className="bg-stone-800 text-white py-5 rounded-[2rem] font-black text-sm shadow-xl shadow-stone-200 active:scale-95 hover:bg-rose-600 transition-all flex items-center justify-center gap-2">
                        餐馆搜寻 <MapPin className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (state.restaurants.length === 0) {
                            alert('您的餐馆列表还是空的！');
                            return;
                          }
                          const random = state.restaurants[Math.floor(Math.random() * state.restaurants.length)];
                          setState(prev => ({ 
                            ...prev, 
                            step: 'result', 
                            recommendation: {
                              id: random.id,
                              name: random.name,
                              description: random.notes || `一家主打${random.cuisine}的餐厅。`,
                              reason: '随机推荐一家餐厅，换个心情！',
                              tags: [random.cuisine, random.status === 'visited' ? '去过' : '想去'],
                              calories: '--',
                              funFact: '去探索新的美味也是一种修行。',
                              imageUrl: random.imageUrl || `https://picsum.photos/seed/${random.name}/800/600`
                            } 
                          }));
                        }} 
                        className="bg-rose-50 text-rose-600 py-5 rounded-[2rem] font-black text-sm shadow-sm active:scale-95 hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                      >
                        随机餐馆 <RefreshCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(state.step === 'loading' || state.step === 'upload_loading') && (
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 border-[6px] border-orange-100 rounded-full"></div>
                    <div className="absolute inset-0 border-[6px] border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ChefHat className="w-12 h-12 text-orange-500" />
                    </div>
                  </div>
                  <p className="text-xl font-black text-gray-800 animate-pulse">{loadingText}</p>
                </div>
              )}

              {state.step === 'result' && state.recommendation && (
                <div className="space-y-6">
                  <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl relative border border-gray-100 flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                      <img src={state.recommendation.imageUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                      <div className="absolute bottom-6 left-6 right-6 md:hidden">
                        <h2 className="text-3xl font-black text-white">{state.recommendation.name}</h2>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-8 flex flex-col justify-between space-y-8">
                      <div className="space-y-6">
                        <div className="hidden md:block">
                          <h2 className="text-4xl font-black text-gray-900 leading-tight">{state.recommendation.name}</h2>
                          <div className="flex flex-wrap gap-2 mt-4">
                            {state.recommendation.tags.map(tag => <span key={tag} className="bg-orange-50 text-orange-500 text-[9px] font-black uppercase px-3 py-1 rounded-full">{tag}</span>)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-3xl space-y-1">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">能量</p>
                            <p className="text-sm font-black text-gray-900">{state.recommendation.calories}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-3xl space-y-1">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">耗时</p>
                            <p className="text-sm font-black text-gray-900">{state.recommendation.prepTime || '25min'}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">推荐理由</h4>
                          </div>
                          <p className="text-gray-800 text-lg font-serif-menu leading-relaxed italic">“{state.recommendation.reason}”</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {state.restaurants.some(r => r.id === state.recommendation?.id) ? (
                          <button onClick={handleShowDetails} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-orange-600 transition-all active:scale-95 shadow-xl">
                            <Utensils className="w-5 h-5" /> 查看菜单
                          </button>
                        ) : (
                          <button onClick={handleShowDetails} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-orange-600 transition-all active:scale-95 shadow-xl">
                            <BookOpen className="w-5 h-5" /> 查看菜谱
                          </button>
                        )}
                        <button onClick={() => setState(prev => ({...prev, isShareModalOpen: true}))} className="bg-white border border-gray-100 p-4 rounded-2xl text-gray-900 hover:border-orange-200 hover:text-orange-500 transition-all shadow-sm">
                          <Share2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => setState(prev => ({ ...prev, step: 'start' }))} className="bg-orange-50 p-4 rounded-2xl text-orange-600 hover:bg-orange-100 transition-all">
                          <RefreshCcw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10 space-y-2">
                      <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">你知道吗？</h4>
                      <p className="text-sm font-light leading-relaxed opacity-80 italic">“{state.recommendation.funFact}”</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* MENU TAB VIEW */}
          {state.activeTab === 'menu' && (
            <motion.div key="menu-view" className="flex-1 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-orange-100 flex-1 flex flex-col">
                {/* Menu Header */}
                <div className="pt-8 pb-6 px-6 text-center border-b border-orange-100/50 bg-gradient-to-b from-orange-50/80 to-white/90 backdrop-blur-md relative z-10">
                  {!isGuest && (
                    <button 
                      onClick={() => setIsFullMenuShareModalOpen(true)}
                      className="absolute top-6 right-6 p-2.5 bg-white border border-orange-200 rounded-xl text-orange-500 shadow-sm hover:shadow-md hover:bg-orange-50 transition-all active:scale-90"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                  {orders.length > 0 && !isGuest && (
                    <button 
                      onClick={() => setOrders([])}
                      className="absolute top-6 left-6 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-500 shadow-sm hover:bg-rose-100 transition-all flex items-center gap-1.5 active:scale-90"
                    >
                      <HistoryIcon className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black">清空</span>
                    </button>
                  )}
                  <h2 className="font-serif-menu text-3xl font-bold text-stone-800 mb-2 tracking-tight">
                    {isGuest ? 'Friend\'s Menu' : 'Private Menu'}
                  </h2>
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-orange-300"></div>
                    <p className="text-orange-600 text-[9px] font-black uppercase tracking-[0.3em]">
                      {isGuest ? '来自好友的私房菜谱' : '我的私人厨房'}
                    </p>
                    <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-orange-300"></div>
                  </div>
                </div>

                {/* Orders Section for Chef */}
                {orders.length > 0 && !isGuest && (
                  <div className="px-10 py-5 bg-rose-50/30 border-b border-rose-100/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-widest">待处理订单 ({orders.length})</h4>
                      <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                      {orders.map((order, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex-shrink-0 bg-white p-4 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-4 min-w-[160px]"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500">
                            <Utensils className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{order.name}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">刚刚下单</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Menu Content - Split Layout */}
                <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-orange-50/30 via-white to-rose-50/30">
                  {/* Sidebar - Categories */}
                  <div className="w-20 md:w-28 bg-white/60 backdrop-blur-md border-r border-orange-100/50 overflow-y-auto no-scrollbar py-4 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                    <div className="px-3 mb-4">
                      <div className="h-[1px] w-full bg-orange-100"></div>
                    </div>
                    {Object.values(Category).map(cat => {
                      const count = state.savedRecipes.filter(r => r.category === cat || (!r.category && cat === Category.OTHER)).length;
                      const isActive = selectedMenuCategory === cat;
                      
                      return (
                        <button 
                          key={cat}
                          onClick={() => setSelectedMenuCategory(cat)}
                          className={`w-full px-2 py-5 flex flex-col items-center gap-2 transition-all relative ${isActive ? 'text-orange-600' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                          {isActive && (
                            <motion.div 
                              layoutId="active-cat-indicator"
                              className="absolute right-0 top-4 bottom-4 w-1 bg-orange-500 rounded-l-full"
                            />
                          )}
                          <span className={`text-[10px] font-black tracking-[0.1em] uppercase leading-tight ${isActive ? 'scale-110' : ''} transition-transform`}>
                            {cat}
                          </span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Main Content - Recipes */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar relative">
                    {/* Decorative background blobs */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                      {/* Kitchen Stats Widget */}
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-orange-100/50 flex flex-col items-center justify-center text-center shadow-sm">
                          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-0.5">总菜品</span>
                          <span className="text-lg font-black text-stone-800">{state.savedRecipes.length}</span>
                        </div>
                        <div className="bg-gradient-to-br from-orange-400 to-rose-400 p-3 rounded-2xl border border-orange-200 flex flex-col items-center justify-center text-center shadow-md text-white">
                          <span className="text-[9px] font-black text-orange-100 uppercase tracking-widest mb-0.5">今日推荐</span>
                          <span className="text-lg font-black">12</span>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-orange-100/50 flex flex-col items-center justify-center text-center shadow-sm">
                          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-0.5">收藏率</span>
                          <span className="text-lg font-black text-stone-800">85%</span>
                        </div>
                      </div>

                      {state.savedRecipes.length === 0 ? (
                      <div className="h-full flex flex-col justify-center items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center border border-gray-100">
                          <Plus className="w-10 h-10 text-gray-200" />
                        </div>
                        <p className="font-serif-menu italic text-gray-400 text-lg">您的菜单还是空的...</p>
                      </div>
                    ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="space-y-0.5">
                              <h3 className="font-serif-menu text-2xl font-bold text-stone-800">{selectedMenuCategory}</h3>
                              <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Selected Category</p>
                            </div>
                            <div className="relative group">
                              <input 
                                type="text"
                                placeholder="搜索菜谱..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white/80 backdrop-blur-sm border border-orange-100 rounded-xl px-3 py-1.5 text-xs font-bold w-28 md:w-40 focus:w-48 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-stone-700 placeholder:text-stone-300 shadow-sm"
                              />
                              <Search className="absolute right-2.5 top-2 w-3 h-3 text-stone-300 group-focus-within:text-orange-500 transition-colors" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            {state.savedRecipes
                              .filter(r => (r.category === selectedMenuCategory || (!r.category && selectedMenuCategory === Category.OTHER)) && 
                                          (r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase())))
                              .map((rec, index) => (
                                <motion.div 
                                  key={rec.id} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="group bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-orange-100/50 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300 flex gap-3 items-center relative overflow-hidden"
                                >
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-100/40 to-rose-100/40 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700"></div>
                                  
                                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white shadow-sm flex-shrink-0 z-10 group-hover:scale-105 transition-transform duration-300">
                                    <img src={rec.imageUrl || 'https://picsum.photos/200/200'} className="w-full h-full object-cover" />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0 z-10">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="space-y-0.5">
                                        <h4 
                                          className="font-serif-menu text-base font-bold text-stone-800 group-hover:text-orange-600 transition-colors cursor-pointer truncate" 
                                          onClick={() => setState(prev => ({ ...prev, step: 'result', activeTab: 'recommend', recommendation: rec }))}
                                        >
                                          {rec.name}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded-md">{rec.calories?.split(' ')[0]} KCAL</span>
                                          <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-0.5"><Clock className="w-2 h-2"/> {rec.prepTime || '20m'}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center flex-shrink-0">
                                        {isGuest ? (
                                          <button 
                                            onClick={() => {
                                              socketRef.current?.emit('send-order', { chefId: targetChefId, order: { name: rec.name, time: new Date().toISOString() } });
                                              alert('下单成功！好友已收到通知。');
                                            }}
                                            className="bg-stone-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md active:scale-90 hover:bg-orange-500 transition-all"
                                          >
                                            Order
                                          </button>
                                        ) : (
                                          <button onClick={() => toggleSaveRecipe(rec)} className="p-1.5 text-stone-300 hover:text-rose-500 transition-colors active:scale-90">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-stone-500 text-[10px] italic line-clamp-1 mt-1.5 font-medium">
                                      {rec.description || "一道充满灵魂的私房佳肴。"}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            
                            {state.savedRecipes.filter(r => r.category === selectedMenuCategory || (!r.category && selectedMenuCategory === Category.OTHER)).length === 0 && (
                              <div className="py-20 text-center">
                                <p className="text-stone-300 font-serif-menu italic text-base">该分类下暂无菜品</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Footer Action */}
                <div className="p-4 bg-white/90 backdrop-blur-md border-t border-orange-100/50 flex gap-3 relative z-20">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 px-3 py-2.5 rounded-xl font-black text-[11px] shadow-sm hover:bg-orange-100 transition-all active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" /> 拍照识别
                  </button>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-stone-800 text-white px-3 py-2.5 rounded-xl font-black text-[11px] shadow-md hover:bg-orange-500 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> 手动添加
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          {/* RESTAURANTS TAB VIEW */}
          {state.activeTab === 'restaurants' && (
            <motion.div key="restaurants-view" className="flex-1 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-orange-100 flex-1 flex flex-col">
                {/* Header */}
                <div className="pt-8 pb-6 px-6 text-center border-b border-orange-100/50 bg-gradient-to-b from-orange-50/80 to-white/90 backdrop-blur-md relative z-10">
                  <h2 className="font-serif-menu text-3xl font-bold text-stone-800 mb-2 tracking-tight">Restaurant Guide</h2>
                  <p className="text-orange-600 text-[9px] font-black uppercase tracking-[0.3em]">我的美食足迹</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar bg-gradient-to-br from-stone-50 via-white to-orange-50/20 relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,165,0,0.05),transparent_70%)] pointer-events-none"></div>
                  <div className="absolute top-0 left-0 w-64 h-64 bg-orange-200/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-200/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
                  
                  <div className="relative z-10 space-y-8">
                    {/* Horizontal Tabs */}
                    <div className="flex p-1.5 bg-stone-100 rounded-2xl gap-1">
                      <button 
                        onClick={() => setRestaurantFilter('want_to_go')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${restaurantFilter === 'want_to_go' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                        <Bookmark className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">想去清单</span>
                        <span className="bg-stone-200 text-stone-500 text-[10px] px-1.5 py-0.5 rounded-md">{state.restaurants.filter(r => r.status === 'want_to_go').length}</span>
                      </button>
                      <button 
                        onClick={() => setRestaurantFilter('visited')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${restaurantFilter === 'visited' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">去过足迹</span>
                        <span className="bg-stone-200 text-stone-500 text-[10px] px-1.5 py-0.5 rounded-md">{state.restaurants.filter(r => r.status === 'visited').length}</span>
                      </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white/80 backdrop-blur-md p-5 rounded-[2.5rem] border border-orange-100/50 shadow-xl space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <Utensils className="w-3 h-3" /> 菜系
                          </label>
                          <select 
                            value={resCuisineFilter}
                            onChange={e => setResCuisineFilter(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-2.5 text-[11px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none cursor-pointer"
                          >
                            <option value="全部">全部菜系</option>
                            {Array.from(new Set(state.restaurants.map(r => r.cuisine))).map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <MapPin className="w-3 h-3" /> 地区
                          </label>
                          <select 
                            value={resLocationFilter}
                            onChange={e => setResLocationFilter(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-2.5 text-[11px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none cursor-pointer"
                          >
                            <option value="全部">全部地区</option>
                            {(() => {
                              const counts: Record<string, number> = {};
                              state.restaurants.forEach(r => {
                                counts[r.location] = (counts[r.location] || 0) + 1;
                              });
                              return Object.entries(counts)
                                .sort((a, b) => b[1] - a[1])
                                .map(([loc]) => (
                                  <option key={loc} value={loc}>{loc}</option>
                                ));
                            })()}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Compass className="w-3 h-3" /> 距离
                            </label>
                            <span className="text-[10px] font-black text-orange-500">{resDistanceFilter || '不限'}km</span>
                          </div>
                          <input 
                            type="range" min="0" max="50" step="1" 
                            value={resDistanceFilter || 50} 
                            onChange={e => setResDistanceFilter(e.target.value === '50' ? null : Number(e.target.value))}
                            className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                            <Star className="w-3 h-3" /> 评分
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <button 
                                key={s}
                                onClick={() => setResRatingFilter(resRatingFilter === s ? null : s)}
                                className={`flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${resRatingFilter === s ? 'bg-orange-500 text-white shadow-md' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="text-sm">¥</span> 预算
                          </label>
                          <span className="text-[10px] font-black text-orange-500">{resPriceFilter || '不限'}元以下</span>
                        </div>
                        <input 
                          type="range" min="0" max="1000" step="50" 
                          value={resPriceFilter || 1000} 
                          onChange={e => setResPriceFilter(e.target.value === '1000' ? null : Number(e.target.value))}
                          className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>
                    </div>

                    {state.restaurants
                      .filter(r => r.status === restaurantFilter)
                      .filter(r => resCuisineFilter === '全部' || r.cuisine === resCuisineFilter)
                      .filter(r => resLocationFilter === '全部' || r.location === resLocationFilter)
                      .filter(r => resDistanceFilter === null || (r.distance !== undefined && r.distance <= resDistanceFilter))
                      .filter(r => resRatingFilter === null || (r.overallRating !== undefined && r.overallRating >= resRatingFilter))
                      .filter(r => resPriceFilter === null || r.avgPrice <= resPriceFilter)
                      .length === 0 ? (
                      <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                          {restaurantFilter === 'want_to_go' ? <Bookmark className="w-8 h-8 text-orange-200" /> : <CheckCircle2 className="w-8 h-8 text-orange-200" />}
                        </div>
                        <p className="text-stone-300 font-serif-menu italic">没有符合筛选条件的餐厅...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {state.restaurants
                          .filter(r => r.status === restaurantFilter)
                          .filter(r => resCuisineFilter === '全部' || r.cuisine === resCuisineFilter)
                          .filter(r => resLocationFilter === '全部' || r.location === resLocationFilter)
                          .filter(r => resDistanceFilter === null || (r.distance !== undefined && r.distance <= resDistanceFilter))
                          .filter(r => resRatingFilter === null || (r.overallRating !== undefined && r.overallRating >= resRatingFilter))
                          .filter(r => resPriceFilter === null || r.avgPrice <= resPriceFilter)
                          .map((res, i) => renderRestaurantCard(res, i))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/90 backdrop-blur-md border-t border-orange-100/50 flex gap-3 relative z-20">
                  <button 
                    onClick={() => {
                      setEditingRestaurant({ status: 'want_to_go', cuisine: '中餐', location: '南昌', avgPrice: 50, dishesToTry: [] });
                      setIsRestaurantModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 px-3 py-2.5 rounded-xl font-black text-[11px] shadow-sm hover:bg-orange-100 transition-all active:scale-95"
                  >
                    <Bookmark className="w-3.5 h-3.5" /> 标记想去
                  </button>
                  <button 
                    onClick={() => {
                      setEditingRestaurant({ status: 'visited', cuisine: '中餐', location: '南昌', avgPrice: 100, overallRating: 5, dishRatings: [] });
                      setIsRestaurantModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-stone-800 text-white px-3 py-2.5 rounded-xl font-black text-[11px] shadow-md hover:bg-orange-500 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> 记录吃过
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Bottom Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-xs z-50">
        <div className="bg-gray-900/90 backdrop-blur-2xl rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 p-1.5 flex justify-around items-center">
          <button 
            onClick={() => setActiveTab('recommend')}
            className={`flex items-center justify-center gap-2 flex-1 py-3.5 transition-all rounded-full ${state.activeTab === 'recommend' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Compass className={`w-5 h-5 ${state.activeTab === 'recommend' ? 'animate-spin-slow' : ''}`} />
            {state.activeTab === 'recommend' && <span className="text-[10px] font-black uppercase tracking-widest">探索</span>}
          </button>
          
          <div className="w-px h-6 bg-white/10"></div>

          <button 
            onClick={() => setActiveTab('menu')}
            className={`flex items-center justify-center gap-2 flex-1 py-3.5 transition-all rounded-full ${state.activeTab === 'menu' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <LayoutGrid className="w-5 h-5" />
            {state.activeTab === 'menu' && <span className="text-[10px] font-black uppercase tracking-widest">菜单</span>}
          </button>
          <button 
            onClick={() => setActiveTab('restaurants')}
            className={`flex items-center justify-center gap-2 flex-1 py-3.5 transition-all rounded-full ${state.activeTab === 'restaurants' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <MapPin className="w-5 h-5" />
            {state.activeTab === 'restaurants' && <span className="text-[10px] font-black uppercase tracking-widest">餐馆</span>}
          </button>
        </div>
      </nav>

      {/* Shared Modals */}
      <AnimatePresence>
        {/* Restaurant Add/Edit Modal */}
        {isRestaurantModalOpen && editingRestaurant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRestaurantModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl border border-white/20">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-2 rounded-xl text-white"><MapPin className="w-5 h-5" /></div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">{editingRestaurant.id ? '编辑餐厅' : '记录餐厅'}</h3>
                </div>
                <button onClick={() => setIsRestaurantModalOpen(false)} className="p-2 bg-gray-50 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">餐厅图片</label>
                      <div 
                        className="w-full h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-orange-300 transition-all"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (re) => {
                                setEditingRestaurant(prev => ({ ...prev, imageUrl: re.target?.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        {editingRestaurant.imageUrl ? (
                          <img src={editingRestaurant.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-orange-400 transition-colors" />
                            <span className="text-[10px] font-black text-gray-400 mt-2">点击上传餐厅门面或环境图</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">餐厅名称</label>
                      <input 
                        type="text" 
                        value={editingRestaurant.name || ''} 
                        onChange={e => setEditingRestaurant(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        placeholder="例如：老王私房菜"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">所在地</label>
                      <input 
                        type="text" 
                        value={editingRestaurant.location || ''} 
                        onChange={e => setEditingRestaurant(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        placeholder="例如：南昌、上海"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">详细地址</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input 
                          type="text" 
                          value={editingRestaurant.address || ''} 
                          onChange={e => setEditingRestaurant(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          placeholder="输入详细地址，可点击跳转地图"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">距离 (km)</label>
                      <div className="relative">
                        <Compass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input 
                          type="number" 
                          value={editingRestaurant.distance || ''} 
                          onChange={e => setEditingRestaurant(prev => ({ ...prev, distance: Number(e.target.value) }))}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          placeholder="例如：2.5"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">菜系</label>
                      <input 
                        type="text" 
                        value={editingRestaurant.cuisine || ''} 
                        onChange={e => setEditingRestaurant(prev => ({ ...prev, cuisine: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        placeholder="例如：川菜、日料"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">人均消费 (元)</label>
                      <input 
                        type="number" 
                        value={editingRestaurant.avgPrice || ''} 
                        onChange={e => setEditingRestaurant(prev => ({ ...prev, avgPrice: Number(e.target.value) }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        placeholder="例如：80"
                      />
                    </div>
                  </div>

                  {editingRestaurant.status === 'want_to_go' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">想吃的菜</label>
                        <button 
                          onClick={() => setEditingRestaurant(prev => ({ ...prev, dishesToTry: [...(prev!.dishesToTry || []), { name: '' }] }))}
                          className="text-orange-500 text-[10px] font-black uppercase flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full"
                        >
                          <Plus className="w-3 h-3" /> 添加
                        </button>
                      </div>
                      <div className="space-y-4">
                        {editingRestaurant.dishesToTry?.map((dish, i) => (
                          <div key={i} className="flex gap-3 items-center bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                            <div 
                              className="w-12 h-12 bg-white border border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e: any) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (re) => {
                                      const newDishes = [...(editingRestaurant.dishesToTry || [])];
                                      newDishes[i].imageUrl = re.target?.result as string;
                                      setEditingRestaurant(prev => ({ ...prev, dishesToTry: newDishes }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                };
                                input.click();
                              }}
                            >
                              {dish.imageUrl ? (
                                <img src={dish.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                <Camera className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                            <input 
                              type="text" 
                              placeholder="菜名" 
                              value={dish.name} 
                              onChange={e => {
                                const newDishes = [...(editingRestaurant.dishesToTry || [])];
                                newDishes[i].name = e.target.value;
                                setEditingRestaurant(prev => ({ ...prev, dishesToTry: newDishes }));
                              }}
                              className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold"
                            />
                            <button 
                              onClick={() => {
                                const newDishes = editingRestaurant.dishesToTry?.filter((_, idx) => idx !== i);
                                setEditingRestaurant(prev => ({ ...prev, dishesToTry: newDishes }));
                              }}
                              className="text-gray-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editingRestaurant.status === 'visited' && (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">总体评分</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button 
                              key={star}
                              onClick={() => setEditingRestaurant(prev => ({ ...prev, overallRating: star }))}
                              className={`p-2 rounded-xl transition-all ${editingRestaurant.overallRating && editingRestaurant.overallRating >= star ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}
                            >
                              <Star className={`w-6 h-6 ${editingRestaurant.overallRating && editingRestaurant.overallRating >= star ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">菜品评价</label>
                          <button 
                            onClick={() => setEditingRestaurant(prev => ({ ...prev, dishRatings: [...(prev!.dishRatings || []), { name: '', rating: 5, comment: '' }] }))}
                            className="text-orange-500 text-[10px] font-black uppercase flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full"
                          >
                            <Plus className="w-3 h-3" /> 添加评价
                          </button>
                        </div>
                        <div className="space-y-6">
                          {editingRestaurant.dishRatings?.map((dish, i) => (
                            <div key={i} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4 relative">
                              <button 
                                onClick={() => {
                                  const newDishes = editingRestaurant.dishRatings?.filter((_, idx) => idx !== i);
                                  setEditingRestaurant(prev => ({ ...prev, dishRatings: newDishes }));
                                }}
                                className="absolute top-4 right-4 text-gray-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              
                              <div className="flex gap-3 items-center">
                                <div 
                                  className="w-12 h-12 bg-white border border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e: any) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (re) => {
                                          const newDishes = [...(editingRestaurant.dishRatings || [])];
                                          newDishes[i].imageUrl = re.target?.result as string;
                                          setEditingRestaurant(prev => ({ ...prev, dishRatings: newDishes }));
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    };
                                    input.click();
                                  }}
                                >
                                  {dish.imageUrl ? (
                                    <img src={dish.imageUrl} className="w-full h-full object-cover" />
                                  ) : (
                                    <Camera className="w-5 h-5 text-gray-300" />
                                  )}
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="菜名" 
                                  value={dish.name} 
                                  onChange={e => {
                                    const newDishes = [...(editingRestaurant.dishRatings || [])];
                                    newDishes[i].name = e.target.value;
                                    setEditingRestaurant(prev => ({ ...prev, dishRatings: newDishes }));
                                  }}
                                  className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold"
                                />
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <button 
                                      key={s}
                                      onClick={() => {
                                        const newDishes = [...(editingRestaurant.dishRatings || [])];
                                        newDishes[i].rating = s;
                                        setEditingRestaurant(prev => ({ ...prev, dishRatings: newDishes }));
                                      }}
                                    >
                                      <Star className={`w-3.5 h-3.5 ${dish.rating >= s ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <textarea 
                                placeholder="味道如何？" 
                                value={dish.comment} 
                                onChange={e => {
                                  const newDishes = [...(editingRestaurant.dishRatings || [])];
                                  newDishes[i].comment = e.target.value;
                                  setEditingRestaurant(prev => ({ ...prev, dishRatings: newDishes }));
                                }}
                                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium h-20 resize-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">备注</label>
                    <textarea 
                      value={editingRestaurant.notes || ''} 
                      onChange={e => setEditingRestaurant(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none"
                      placeholder="写点什么吧..."
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-50 bg-white">
                <button 
                  onClick={() => {
                    if (!editingRestaurant.name) {
                      alert('请输入餐厅名称');
                      return;
                    }
                    const finalRes: Restaurant = {
                      ...editingRestaurant as Restaurant,
                      id: editingRestaurant.id || Date.now().toString()
                    };
                    
                    setState(prev => {
                      const exists = prev.restaurants.some(r => r.id === finalRes.id);
                      if (exists) {
                        return { ...prev, restaurants: prev.restaurants.map(r => r.id === finalRes.id ? finalRes : r) };
                      }
                      return { ...prev, restaurants: [finalRes, ...prev.restaurants] };
                    });
                    
                    setIsRestaurantModalOpen(false);
                    setEditingRestaurant(null);
                  }}
                  className="w-full bg-gray-900 text-white py-5 rounded-full font-black text-lg shadow-2xl shadow-gray-200 active:scale-95 hover:bg-orange-600 transition-all"
                >
                  保存记录
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {state.isRecipeModalOpen && state.recommendation?.recipe && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setState(prev => ({ ...prev, isRecipeModalOpen: false }))} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-lg"><ChefHat className="w-7 h-7" /></div>
                  <h3 className="text-2xl font-black text-gray-900">{state.recommendation.name}</h3>
                </div>
                <button onClick={() => setState(prev => ({ ...prev, isRecipeModalOpen: false }))} className="p-3 bg-gray-50 rounded-full"><X className="w-6 h-6 text-gray-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-12">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">准备食材</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {state.recommendation.recipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50/80 px-4 py-3 rounded-xl border border-gray-100/50">
                        <span className="text-gray-800 font-bold text-sm">{ing.item}</span>
                        <span className="text-orange-500 text-[10px] font-black">{ing.amount}</span>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">烹饪步骤</h4>
                  <div className="space-y-6">
                    {state.recommendation.recipe.steps.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-sm">{i + 1}</div>
                        <p className="text-gray-700 font-bold leading-relaxed pt-1 text-md">{step}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.isShareModalOpen && state.recommendation && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setState(prev => ({ ...prev, isShareModalOpen: false }))} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
             <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="relative w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-2xl">
                <img src={state.recommendation.imageUrl} className="w-full h-80 object-cover" />
                <div className="p-8 space-y-6">
                  <h2 className="text-3xl font-black text-gray-900">{state.recommendation.name}</h2>
                  <p className="text-gray-500 text-sm italic font-medium leading-relaxed">“这是我私人菜单中最赞的一道菜，分享给挑剔的你！”</p>
                  <div className="flex gap-4">
                     <button onClick={() => window.print()} className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-100">保存并分享</button>
                     <button onClick={() => setState(prev => ({...prev, isShareModalOpen: false}))} className="bg-gray-100 p-4 rounded-2xl"><X className="w-6 h-6" /></button>
                  </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFullMenuShareModalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFullMenuShareModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-orange-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-orange-100">
                <Share2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">分享我的私人菜单</h3>
                <p className="text-gray-500 text-sm mt-2">好友扫码即可查看您的全部拿手菜并直接下单</p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-[2rem] flex justify-center border border-gray-100">
                <QRCodeCanvas 
                  value={`${window.location.origin}/?chefId=${chefId}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "https://picsum.photos/seed/chef/100/100",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/?chefId=${chefId}`;
                    navigator.clipboard.writeText(url);
                    alert('链接已复制！快去发给微信好友吧。');
                  }}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all"
                >
                  复制分享链接
                </button>
                <button 
                  onClick={() => setIsFullMenuShareModalOpen(false)}
                  className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold active:scale-95 transition-all"
                >
                  返回
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg max-h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl border border-white/20">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-2 rounded-xl text-white"><Plus className="w-5 h-5" /></div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">手动添加菜谱</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-gray-50 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div 
                      onClick={() => document.getElementById('manual-image-upload')?.click()}
                      className="w-full h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-all overflow-hidden relative group"
                    >
                      {manualRecipeImage ? (
                        <>
                          <img src={manualRecipeImage} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-8 h-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Camera className="w-10 h-10 text-gray-300 mb-2" />
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">上传菜品图片</span>
                        </>
                      )}
                    </div>
                    <input 
                      id="manual-image-upload"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setManualRecipeImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">菜品名称</label>
                    <input 
                      type="text" 
                      value={newRecipe.name} 
                      onChange={e => setNewRecipe(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      placeholder="例如：秘制红烧肉"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">分类</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(Category).map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setNewRecipe(prev => ({ ...prev, category: cat }))}
                          className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newRecipe.category === cat ? 'bg-gray-900 text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">热量 (kcal)</label>
                    <input 
                      type="text" 
                      value={newRecipe.calories} 
                      onChange={e => setNewRecipe(prev => ({ ...prev, calories: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      placeholder="300-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">准备耗时</label>
                    <input 
                      type="text" 
                      value={newRecipe.prepTime} 
                      onChange={e => setNewRecipe(prev => ({ ...prev, prepTime: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      placeholder="20分钟"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">简短描述</label>
                  <textarea 
                    value={newRecipe.description} 
                    onChange={e => setNewRecipe(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none"
                    placeholder="这道菜有什么特别之处？"
                  />
                  </div>
                </div>

                {/* Ingredients */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">食材清单</label>
                    <button 
                      onClick={() => setNewRecipe(prev => ({ ...prev, recipe: { ...prev.recipe!, ingredients: [...prev.recipe!.ingredients, { item: '', amount: '' }] } }))}
                      className="text-orange-500 text-[10px] font-black uppercase flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full"
                    >
                      <Plus className="w-3 h-3" /> 添加食材
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newRecipe.recipe?.ingredients.map((ing, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <input 
                          type="text" 
                          placeholder="食材" 
                          value={ing.item} 
                          onChange={e => {
                            const newIngs = [...newRecipe.recipe!.ingredients];
                            newIngs[i].item = e.target.value;
                            setNewRecipe(prev => ({ ...prev, recipe: { ...prev.recipe!, ingredients: newIngs } }));
                          }}
                          className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                        />
                        <input 
                          type="text" 
                          placeholder="用量" 
                          value={ing.amount} 
                          onChange={e => {
                            const newIngs = [...newRecipe.recipe!.ingredients];
                            newIngs[i].amount = e.target.value;
                            setNewRecipe(prev => ({ ...prev, recipe: { ...prev.recipe!, ingredients: newIngs } }));
                          }}
                          className="w-28 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                        />
                        {newRecipe.recipe!.ingredients.length > 1 && (
                          <button 
                            onClick={() => {
                              const newIngs = newRecipe.recipe!.ingredients.filter((_, idx) => idx !== i);
                              setNewRecipe(prev => ({ ...prev, recipe: { ...prev.recipe!, ingredients: newIngs } }));
                            }}
                            className="text-gray-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">烹饪步骤</label>
                    <button 
                      onClick={() => setNewRecipe(prev => ({ ...prev, recipe: { ...prev.recipe!, steps: [...prev.recipe!.steps, ''] } }))}
                      className="text-orange-500 text-[10px] font-black uppercase flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full"
                    >
                      <Plus className="w-3 h-3" /> 添加步骤
                    </button>
                  </div>
                  <div className="space-y-4">
                    {newRecipe.recipe?.steps.map((step, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <span className="bg-gray-900 text-white w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black mt-2 flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 relative">
                          <textarea 
                            placeholder={`步骤 ${i + 1}`} 
                            value={step} 
                            onChange={e => {
                              const newSteps = [...newRecipe.recipe!.steps];
                              newSteps[i] = e.target.value;
                              setNewRecipe(prev => ({ ...prev, recipe: { ...prev.recipe!, steps: newSteps } }));
                            }}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none"
                          />
                          {newRecipe.recipe!.steps.length > 1 && (
                            <button 
                              onClick={() => {
                                const newSteps = newRecipe.recipe!.steps.filter((_, idx) => idx !== i);
                                setNewRecipe(prev => ({ ...prev, recipe: { ...prev.recipe!, steps: newSteps } }));
                              }}
                              className="absolute top-2 right-2 text-gray-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-50 bg-white flex gap-4">
                <button 
                  onClick={() => {
                    if (!newRecipe.name) {
                      alert('请输入菜品名称');
                      return;
                    }
                    const finalRecipe: Recommendation = {
                      ...newRecipe as Recommendation,
                      id: Date.now().toString(),
                      tags: newRecipe.tags || ['手动添加'],
                      reason: '这是您亲手录入的美味',
                      imageUrl: manualRecipeImage || `https://picsum.photos/seed/${newRecipe.name}/800/600`,
                      funFact: newRecipe.funFact || '这道菜承载着您的独家记忆。'
                    };
                    setState(prev => ({ ...prev, savedRecipes: [finalRecipe, ...prev.savedRecipes] }));
                    setIsAddModalOpen(false);
                    setManualRecipeImage(null);
                    setNewRecipe({
                      name: '',
                      category: Category.MEAT,
                      description: '',
                      tags: [],
                      calories: '300-500 kcal',
                      funFact: '',
                      recipe: {
                        ingredients: [{ item: '', amount: '' }],
                        steps: [''],
                        tips: ['']
                      }
                    });
                  }}
                  className="flex-1 bg-gray-900 text-white py-5 rounded-full font-black text-lg shadow-2xl shadow-gray-200 active:scale-95 hover:bg-orange-600 transition-all"
                >
                  保存到我的菜单
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-auto py-6 text-gray-400 text-[8px] font-black uppercase tracking-[0.6em] text-center w-full">Chef Gemini • AI Flavor Decision</footer>
    </div>
  );
};

export default App;
