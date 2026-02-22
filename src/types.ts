
export enum Mood {
  HAPPY = '开心',
  STRESSED = '压力大',
  TIRED = '疲惫',
  ADVENTUROUS = '想尝鲜',
  CALM = '平静'
}

export enum Budget {
  LOW = '省钱简餐',
  MEDIUM = '适中消费',
  HIGH = '犒劳一下'
}

export enum Cuisine {
  CHINESE = '中餐',
  JAPANESE = '日韩料理',
  WESTERN = '西餐',
  SOUTHEAST_ASIAN = '东南亚菜',
  ANY = '随缘推荐'
}

export enum Category {
  MEAT = '肉类',
  VEGETABLE = '蔬菜',
  STAPLE = '主食',
  SOUP = '汤品',
  DESSERT = '甜点/饮品',
  OTHER = '其他'
}

export enum TimePreference {
  ANY = '不限时间',
  UNDER_20 = '20分钟以下',
  MIN_20_40 = '20-40分钟',
  OVER_40 = '40分钟以上'
}

export enum IngredientPreference {
  ANY = '不限食材',
  BEEF = '牛肉',
  PORK = '猪肉',
  CHICKEN = '鸡肉',
  FISH = '鱼/海鲜',
  VEGETABLE = '纯素/蔬菜',
  EGG = '蛋类',
  TOFU = '豆制品'
}

export interface UserPreferences {
  mood: Mood;
  budget: Budget;
  cuisine: Cuisine;
  time: TimePreference;
  ingredient: IngredientPreference | string;
  restrictions: string;
  location: string; // '在家' or specific location
}

export interface Recipe {
  ingredients: { item: string; amount: string }[];
  steps: string[];
  tips: string[];
}

export interface Recommendation {
  id: string;
  name: string;
  description: string;
  reason: string;
  tags: string[];
  calories: string;
  funFact: string;
  imageUrl?: string;
  category?: Category;
  recipe?: Recipe;
  isCustom?: boolean;
  prepTime?: string;
  difficulty?: '简单' | '中等' | '困难';
}

export interface DishRating {
  name: string;
  rating: number;
  comment?: string;
  imageUrl?: string;
}

export interface DishToTry {
  name: string;
  imageUrl?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  address?: string;
  distance?: number;
  avgPrice: number;
  status: 'want_to_go' | 'visited';
  overallRating?: number;
  dishRatings?: DishRating[];
  dishesToTry?: DishToTry[];
  notes?: string;
  imageUrl?: string;
  visitCount?: number;
  visitHistory?: string[]; // ISO strings
}

export type TabType = 'recommend' | 'menu' | 'restaurants';

export interface AppState {
  step: 'start' | 'questions' | 'loading' | 'result' | 'upload_loading';
  activeTab: TabType;
  preferences: UserPreferences;
  recommendation: Recommendation | null;
  history: Recommendation[];
  savedRecipes: Recommendation[];
  restaurants: Restaurant[];
  isRecipeModalOpen: boolean;
  isFetchingRecipe: boolean;
  isShareModalOpen: boolean;
}
