from settings import (
    SNAKE_INIT_X, SNAKE_INIT_Y, SNAKE_INIT_LENGTH,
    GRID_SIZE, WINDOW_WIDTH, WINDOW_HEIGHT,
    UP, DOWN, LEFT, RIGHT
)


class Snake:
    def __init__(self):
        """初始化蛇的属性"""
        # 初始化蛇的位置（从中心开始）
        self.x = SNAKE_INIT_X
        self.y = SNAKE_INIT_Y

        # 初始化蛇的身体部分（列表中的每个元素是一个坐标元组）
        self.body = []
        for i in range(SNAKE_INIT_LENGTH):
            self.body.append((self.x, self.y - i * GRID_SIZE))

        # 初始方向（向右）
        self.direction = RIGHT
        self.next_direction = RIGHT  # 添加下一个方向的缓存
        # 是否需要增长
        self.should_grow = False

    def move(self):
        """移动蛇"""
        # 更新当前方向为缓存的下一个方向
        self.direction = self.next_direction

        # 根据当前方向计算新的头部位置
        if self.direction == UP:
            new_head = (self.body[0][0], self.body[0][1] - GRID_SIZE)
        elif self.direction == DOWN:
            new_head = (self.body[0][0], self.body[0][1] + GRID_SIZE)
        elif self.direction == LEFT:
            new_head = (self.body[0][0] - GRID_SIZE, self.body[0][1])
        elif self.direction == RIGHT:
            new_head = (self.body[0][0] + GRID_SIZE, self.body[0][1])

        # 在头部添加新的位置
        self.body.insert(0, new_head)

        # 如果不需要增长，则移除尾部
        if not self.should_grow:
            self.body.pop()
        else:
            self.should_grow = False

    def change_direction(self, new_direction):
        """改变蛇的方向，防止180度转弯"""
        opposite_directions = {
            UP: DOWN,
            DOWN: UP,
            LEFT: RIGHT,
            RIGHT: LEFT
        }
        # 如果新方向不是当前方向的相反方向，则改变下一个方向
        if new_direction != opposite_directions.get(self.direction):
            self.next_direction = new_direction

    def grow(self):
        """标记蛇需要增长"""
        self.should_grow = True

    def check_collision(self):
        """检查是否发生碰撞（撞墙或撞到自己）"""
        head = self.body[0]

        # 检查是否撞墙
        if (head[0] < 0 or head[0] >= WINDOW_WIDTH or
                head[1] < 0 or head[1] >= WINDOW_HEIGHT):
            return True

        # 检查是否撞到自己（从第二个身体部分开始检查）
        if head in self.body[1:]:
            return True

        return False

    def get_head_position(self):
        """获取蛇头位置"""
        return self.body[0]
