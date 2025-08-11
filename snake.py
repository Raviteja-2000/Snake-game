import pygame
import random

# Initialize pygame
pygame.init()
pygame.mixer.init()

# Screen size
dis_width = 600
dis_height = 500  # Extra space at bottom for buttons
game_area_height = 400  # Snake game area height

# Colors
white = (255, 255, 255)
yellow = (255, 255, 102)
black = (0, 0, 0)
red = (213, 50, 80)
green = (0, 255, 0)
blue = (50, 153, 213)
gray = (180, 180, 180)

# Display
dis = pygame.display.set_mode((dis_width, dis_height))
pygame.display.set_caption('Snake Game - Mobile Friendly')

clock = pygame.time.Clock()
snake_block = 10
snake_speed = 12

font_style = pygame.font.SysFont(None, 35)
score_font = pygame.font.SysFont(None, 25)

# Button areas (x, y, w, h)
btn_up = pygame.Rect(dis_width//2 - 30, game_area_height + 10, 60, 40)
btn_down = pygame.Rect(dis_width//2 - 30, game_area_height + 60, 60, 40)
btn_left = pygame.Rect(dis_width//2 - 90, game_area_height + 35, 60, 40)
btn_right = pygame.Rect(dis_width//2 + 30, game_area_height + 35, 60, 40)

# Sound for eating food
def play_eat_sound():
    beep = pygame.mixer.Sound(buffer=b'\x00' * 2000)
    beep.play()

def draw_buttons():
    pygame.draw.rect(dis, gray, btn_up)
    pygame.draw.rect(dis, gray, btn_down)
    pygame.draw.rect(dis, gray, btn_left)
    pygame.draw.rect(dis, gray, btn_right)

    dis.blit(font_style.render("↑", True, black), (btn_up.x+20, btn_up.y+5))
    dis.blit(font_style.render("↓", True, black), (btn_down.x+20, btn_down.y+5))
    dis.blit(font_style.render("←", True, black), (btn_left.x+20, btn_left.y+5))
    dis.blit(font_style.render("→", True, black), (btn_right.x+20, btn_right.y+5))

def your_score(score):
    value = score_font.render("Score: " + str(score), True, yellow)
    dis.blit(value, [0, 0])

def our_snake(snake_block, snake_list):
    for x in snake_list:
        pygame.draw.rect(dis, green, [x[0], x[1], snake_block, snake_block])

def message(msg, color):
    mesg = font_style.render(msg, True, color)
    dis.blit(mesg, [dis_width / 6, game_area_height / 2])

def gameLoop():
    game_over = False
    game_close = False

    x1 = dis_width / 2
    y1 = game_area_height / 2
    x1_change = 0
    y1_change = 0

    snake_List = []
    Length_of_snake = 1

    foodx = round(random.randrange(0, dis_width - snake_block) / 10.0) * 10.0
    foody = round(random.randrange(0, game_area_height - snake_block) / 10.0) * 10.0

    while not game_over:

        while game_close:
            dis.fill(blue)
            message("You Lost! Tap to Restart", red)
            your_score(Length_of_snake - 1)
            pygame.display.update()

            for event in pygame.event.get():
                if event.type == pygame.MOUSEBUTTONDOWN:
                    gameLoop()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                game_over = True

            if event.type == pygame.MOUSEBUTTONDOWN:
                pos = pygame.mouse.get_pos()
                if btn_up.collidepoint(pos) and y1_change == 0:
                    x1_change = 0
                    y1_change = -snake_block
                elif btn_down.collidepoint(pos) and y1_change == 0:
                    x1_change = 0
                    y1_change = snake_block
                elif btn_left.collidepoint(pos) and x1_change == 0:
                    x1_change = -snake_block
                    y1_change = 0
                elif btn_right.collidepoint(pos) and x1_change == 0:
                    x1_change = snake_block
                    y1_change = 0

        # Borders for game area
        if x1 >= dis_width or x1 < 0 or y1 >= game_area_height or y1 < 0:
            game_close = True

        x1 += x1_change
        y1 += y1_change

        dis.fill(black, (0, 0, dis_width, game_area_height))
        pygame.draw.rect(dis, red, [foodx, foody, snake_block, snake_block])

        snake_Head = [x1, y1]
        snake_List.append(snake_Head)
        if len(snake_List) > Length_of_snake:
            del snake_List[0]

        for x in snake_List[:-1]:
            if x == snake_Head:
                game_close = True

        our_snake(snake_block, snake_List)
        your_score(Length_of_snake - 1)

        # Draw buttons area
        draw_buttons()

        pygame.display.update()

        if x1 == foodx and y1 == foody:
            foodx = round(random.randrange(0, dis_width - snake_block) / 10.0) * 10.0
            foody = round(random.randrange(0, game_area_height - snake_block) / 10.0) * 10.0
            Length_of_snake += 1
            play_eat_sound()

        clock.tick(snake_speed)

    pygame.quit()
    quit()

gameLoop()