import random
from settings import GRID_SIZE, WINDOW_WIDTH, WINDOW_HEIGHT


class Food:
    def __init__(self):
        """初始化食物"""
        self.position = self.generate_new_position()

    def generate_new_position(self):
        """生成新的食物位置"""
        # 计算网格数量
        grid_width = WINDOW_WIDTH // GRID_SIZE
        grid_height = WINDOW_HEIGHT // GRID_SIZE

        # 随机生成位置（确保在网格上对齐）
        x = random.randint(0, grid_width - 1) * GRID_SIZE
        y = random.randint(0, grid_height - 1) * GRID_SIZE

        return (x, y)

    def check_collision(self, snake_head):
        """检查是否被蛇吃到"""
        return self.position == snake_head

    def respawn(self, snake_body):
        """重新生成食物，确保不会出现在蛇身上"""
        while True:
            new_position = self.generate_new_position()
            if new_position not in snake_body:
                self.position = new_position
                break
