# 游戏设置和常量配置

class Settings:
    """游戏设置类"""
    def __init__(self):
        # 窗口设置
        self.screen_width = 800  # 游戏窗口宽度
        self.screen_height = 600  # 游戏窗口高度
        self.grid_size = 20  # 网格大小
        self.fps = 60  # 游戏帧率（控制画面刷新）
        self.snake_speed = 4  # 蛇的移动速度（每秒移动的格子数）

        # 颜色定义 (RGB)
        self.bg_color = (0, 0, 0)  # 背景色
        self.grid_color = (255, 255, 255)  # 网格线
        self.snake_color = (0, 255, 0)  # 蛇的颜色
        self.food_color = (255, 0, 0)  # 食物的颜色
        self.border_color = (128, 128, 128)  # 边框颜色

        # 方向键定义
        self.UP = 'UP'
        self.DOWN = 'DOWN'
        self.LEFT = 'LEFT'
        self.RIGHT = 'RIGHT'

        # 初始蛇的设置
        self.SNAKE_INIT_LENGTH = 3  # 初始长度
        self.SNAKE_INIT_X = self.screen_width // 2  # 初始X坐标
        self.SNAKE_INIT_Y = self.screen_height // 2  # 初始Y坐标

        # 游戏状态
        self.GAME_RUNNING = 'RUNNING'
        self.GAME_PAUSED = 'PAUSED'
        self.GAME_OVER = 'GAME_OVER'

# 导出常量
SNAKE_INIT_LENGTH = Settings().SNAKE_INIT_LENGTH
UP = Settings().UP
DOWN = Settings().DOWN
LEFT = Settings().LEFT
RIGHT = Settings().RIGHT
GAME_RUNNING = Settings().GAME_RUNNING
GAME_PAUSED = Settings().GAME_PAUSED
GAME_OVER = Settings().GAME_OVER
