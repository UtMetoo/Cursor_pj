import pygame
import sys
from settings import (
    WINDOW_WIDTH, WINDOW_HEIGHT, GRID_SIZE,
    BLACK, WHITE, GREEN, RED,
    UP, DOWN, LEFT, RIGHT,
    GAME_RUNNING, GAME_PAUSED, GAME_OVER,
    FPS, SNAKE_SPEED
)
from snake import Snake
from food import Food


class Game:
    def __init__(self):
        """初始化游戏"""
        pygame.init()
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption('贪吃蛇')
        self.clock = pygame.time.Clock()
        
        # 时间控制相关
        self.fixed_time_step = 1.0 / SNAKE_SPEED  # 固定时间步长
        self.time_accumulator = 0.0  # 时间累积器
        
        # 使用系统中文字体
        try:
            self.font = pygame.font.Font("/System/Library/Fonts/PingFang.ttc", 36)  # macOS系统字体
        except:
            try:
                self.font = pygame.font.Font("/System/Library/Fonts/STHeiti Light.ttc", 36)  # 备选字体
            except:
                print("警告：无法加载中文字体，将使用默认字体")
                self.font = pygame.font.Font(None, 36)

        self.reset_game()

    def reset_game(self):
        """重置游戏状态"""
        self.snake = Snake()
        self.food = Food()
        self.score = 0
        self.game_state = GAME_RUNNING

    def handle_input(self):
        """处理用户输入"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

            if event.type == pygame.KEYDOWN:
                if self.game_state == GAME_RUNNING:
                    if event.key == pygame.K_UP:
                        self.snake.change_direction(UP)
                    elif event.key == pygame.K_DOWN:
                        self.snake.change_direction(DOWN)
                    elif event.key == pygame.K_LEFT:
                        self.snake.change_direction(LEFT)
                    elif event.key == pygame.K_RIGHT:
                        self.snake.change_direction(RIGHT)
                    elif event.key == pygame.K_p:
                        self.game_state = GAME_PAUSED

                elif self.game_state == GAME_PAUSED:
                    if event.key == pygame.K_p:
                        self.game_state = GAME_RUNNING

                elif self.game_state == GAME_OVER:
                    if event.key == pygame.K_SPACE:
                        self.reset_game()

    def update(self):
        """更新游戏状态"""
        if self.game_state != GAME_RUNNING:
            return

        # 移动蛇
        self.snake.move()

        # 检查是否吃到食物
        if self.food.check_collision(self.snake.get_head_position()):
            self.snake.grow()
            self.food.respawn(self.snake.body)
            self.score += 1

        # 检查是否发生碰撞
        if self.snake.check_collision():
            self.game_state = GAME_OVER

    def draw(self):
        """绘制游戏画面"""
        self.screen.fill(BLACK)

        # 绘制蛇
        for segment in self.snake.body:
            pygame.draw.rect(
                self.screen, GREEN,
                (segment[0], segment[1], GRID_SIZE, GRID_SIZE)
            )

        # 绘制食物
        pygame.draw.rect(
            self.screen, RED,
            (self.food.position[0], self.food.position[1],
             GRID_SIZE, GRID_SIZE)
        )

        # 绘制网格线
        self.draw_grid(self.screen, WHITE)

        # 绘制得分
        score_text = self.font.render(f'得分: {self.score}', True, WHITE)
        self.screen.blit(score_text, (10, 10))

        # 绘制游戏状态
        if self.game_state == GAME_PAUSED:
            self.draw_message('游戏暂停 - 按P继续')
        elif self.game_state == GAME_OVER:
            self.draw_message('游戏结束 - 按空格重新开始')

        pygame.display.flip()

    def draw_grid(self, screen, color):
        """绘制网格线"""
        for x in range(0, WINDOW_WIDTH, GRID_SIZE):
            pygame.draw.line(screen, color, (x, 0), (x, WINDOW_HEIGHT))
        for y in range(0, WINDOW_HEIGHT, GRID_SIZE):
            pygame.draw.line(screen, color, (0, y), (WINDOW_WIDTH, y))

    def draw_message(self, message):
        """在屏幕中央显示消息"""
        text = self.font.render(message, True, WHITE)
        text_rect = text.get_rect(center=(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2))
        self.screen.blit(text, text_rect)

    def run(self):
        """运行游戏主循环"""
        while True:
            # 计算每帧的时间增量（转换为秒）
            delta_time = self.clock.tick(FPS) / 1000.0
            
            # 累积时间
            self.time_accumulator += delta_time

            # 处理输入（始终检查）
            self.handle_input()

            # 使用固定时间步长更新游戏逻辑
            while self.time_accumulator >= self.fixed_time_step:
                self.update()
                self.time_accumulator -= self.fixed_time_step

            # 渲染（每帧都做）
            self.draw()


if __name__ == '__main__':
    game = Game()
    game.run()
