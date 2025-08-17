from kivy.app import App
from kivy.uix.widget import Widget
from kivy.clock import Clock
from kivy.graphics import Rectangle, Color

class SnakeGame(Widget):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.snake = [(100, 100)]
        self.food = (200, 200)
        Clock.schedule_interval(self.update, 0.1)

    def update(self, dt):
        self.canvas.clear()
        with self.canvas:
            Color(0, 1, 0)
            for x, y in self.snake:
                Rectangle(pos=(x, y), size=(20, 20))
            Color(1, 0, 0)
            Rectangle(pos=self.food, size=(20, 20))

class SnakeApp(App):
    def build(self):
        return SnakeGame()

if __name__ == "__main__":
    SnakeApp().run()