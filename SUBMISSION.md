## 💡 Inspiration

We all grew up doodling on paper and wishing our drawings could “come alive.” With Sketch Air, we wanted to give kids that feeling for real — turning their quick sketches into something fun, polished, and worth sharing, without needing them to be “good at art.”

## 🎨 What it does

Sketch Air lets kids draw something simple, then instantly transform it into different styles like realistic photo, illustrations or pixel art.
They can try multiple looks on the same doodle and see how their idea changes.

## 🛠️ How we built it

We created a simple and intuitive drawing interface where users can sketch in the air. The sketch is then sent to our backend, which uses generative AI to transform the artwork into different visual styles such as realistic illustrations or pixel art. We integrated Google APIs through Pipedream to interpret hand gestures as controls — allowing users to trigger actions, choose tools, and interact with the canvas using natural movements.

## 🚧 Challenges we ran into

One of the first challenges was deciding on the right tech stack to support gesture tracking, real-time drawing, and AI image generation — all while keeping performance smooth. We also had to ensure the AI didn’t “take over” the design: the final output needed to stay true to the child’s original drawing so it still felt like their creation. On the design side, creating a user interface that was fun and intuitive for kids, yet clear and functional for adults, required a lot of testing and iteration.

## 🏆 Accomplishments that we're proud of

We built a complete workflow where kids can draw in the air and watch their sketch appear instantly on the screen. Using simple hand gestures, they can control the experience — saving their art, recording a voice prompt for the AI, or clearing the canvas — all without needing complex buttons or menus.

Our generative AI keeps their imagination at the center of the final output, transforming the drawing while still preserving the child’s original shapes, ideas, and personality. We’re also proud of creating a clean, playful interface that’s fun for kids to explore and intuitive for adults to help guide.

## 📚 What we learned

We learned how important it is to plan early — choosing the right tech stack, defining the core problem, and focusing on the features that truly matter. Without that clarity, it’s easy to get distracted by building “cool” extras instead of solving our main mission: helping kids reduce screen time by unleashing their creativity and turning simple doodles into meaningful art.

We also realized the value of designing with constraints. Setting tight guardrails around AI prompts ensures the output stays age-appropriate and preserves the child’s original ideas rather than overpowering them. And through usability testing, we discovered how different kids are in the way they interact — which pushed us to simplify gestures, reduce clutter, and make interactions feel natural and playful.

## 🚀 What's next for Sketch Air

Next, we want to lean into video and storytelling.
We plan to add one-tap animation actions (wave, jump, fly), simple templates so kids don’t need to type prompts, and the ability to chain a few drawings into a mini storyboard. We also want easy exports (GIFs/short clips) so parents can save and share the kids’ creations.

**Ultimately, the biggest lesson was that technology should enhance creativity — not replace it.**
