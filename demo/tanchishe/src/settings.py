# 游戏设置和常量配置

# 窗口设置
WINDOW_WIDTH = 800  # 游戏窗口宽度
WINDOW_HEIGHT = 600  # 游戏窗口高度
GRID_SIZE = 20  # 网格大小
FPS = 60  # 游戏帧率（控制画面刷新）
SNAKE_SPEED = 6  # 蛇的移动速度（每秒移动的格子数）

# 颜色定义 (RGB)
BLACK = (0, 0, 0)  # 背景色
WHITE = (255, 255, 255)  # 网格线
GREEN = (0, 255, 0)  # 蛇的颜色
RED = (255, 0, 0)  # 食物的颜色
GRAY = (128, 128, 128)  # 边框颜色

# 方向键定义
UP = 'UP'
DOWN = 'DOWN'
LEFT = 'LEFT'
RIGHT = 'RIGHT'

# 初始蛇的位置和长度
SNAKE_INIT_LENGTH = 3  # 初始长度
SNAKE_INIT_X = WINDOW_WIDTH // 2  # 初始X坐标
SNAKE_INIT_Y = WINDOW_HEIGHT // 2  # 初始Y坐标

# 游戏状态
GAME_RUNNING = 'RUNNING'
GAME_PAUSED = 'PAUSED'
GAME_OVER = 'GAME_OVER'
