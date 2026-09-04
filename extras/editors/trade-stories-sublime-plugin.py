import sublime
import sublime_plugin
import re

# Editor hints for Trade Stories using Sublime Text editor.
#
# To install - restart Sublime once done:
#
#   Linux
#     Create a symlink:
#       ln -s /full/path/to/trade-stories/extras/editors/trade-stories-sublime-plugin.py ~/.config/sublime-text/Packages/User/trade-stories-sublime-plugin.py
#
#   MacOS
#     Create a symlink:
#       ln -s /full/path/to/trade-stories/extras/editors/trade-stories-sublime-plugin.py ~/Library/Application Support/Sublime Text/Packages/User/trade-stories-sublime-plugin.py
#
#   Windows
#     Copy this file to:
#       %APPDATA%\Sublime Text\Packages\User\

QUESTIONS = {
    "story": "What are you calling this setup?",
    "trading": "What instrument/market and timeframe is this for?",
    "source": "Which indicators, chart patterns or plotted series does the setup use?",
    "sources": "Which indicators, chart patterns or plotted series does the setup use?",
    "given": "What must already be true for the trade to be considered?",
    "when": "What event or signal triggers entry?",
    "except": "What invalidates entry even if the trigger fires?",
    "or except": "What invalidates entry even if the trigger fires?",
    "then": "What action does the trade take?",
    "with": "What's the position size? Fixed amount or %? Any leverage?",
    "sl": "Where's the stop-loss?",
    "until": "What level (or self-contained set of levels) should the trade be closed at?",
    "or until": "What level (or self-contained set of levels) should the trade be closed at?",
    "taking": "How much profit to take at each level?",
    "unless": "What condition, arising early, exits before target?",
    "or unless": "What condition, arising early, exits before target?",
    "notes": "What context helps a reader, without being acted on?",
    "notes:": "What context helps a reader, without being acted on?"
}

# This pattern matches the start of the line, allows up to 10 spaces of indentation (per syntax rules),
# matches the keyword itself, and allows for trailing whitespace. 
# By enforcing the end of the line ($) right after the spaces, the Phantom acts as a placeholder
# and disappears once the user actually starts typing the predicate.
REGEX_PATTERN = r"(?i)^\s{0,10}(Story|Trading|Sources?|Given|When|Except|Or\s+except|Then|With|SL|Until|Or\s+until|Taking|Unless|Or\s+unless|Notes:?)\s*$"


class TradeStoryHintsListener(sublime_plugin.ViewEventListener):
    """
    Listens for modifications in views that use the TradeStory syntax and manages
    the display of inline phantom hints.
    """

    @classmethod
    def is_applicable(cls, settings):
        """
        Determines if this listener should be activated for the current file.
        We check the syntax file against the 'TradeStory' name defined in your YAML.
        """
        syntax = settings.get('syntax')
        if not syntax:
            return False
        
        # Matches the provided sublime-syntax file scope or name
        return 'TradeStory' in syntax or 'source.trade' in syntax

    def __init__(self, view):
        super().__init__(view)
        # Initialize a PhantomSet to manage our hints efficiently
        self.phantom_set = sublime.PhantomSet(view, "trade_story_hints")
        self.update_phantoms()

    def on_modified_async(self):
        """Triggered asynchronously whenever the text in the view is modified."""
        self.update_phantoms()
        
    def on_activated_async(self):
        """Triggered when the file is opened or gains focus."""
        self.update_phantoms()

    def update_phantoms(self):
        """
        Scans the document for empty keyword lines and renders the corresponding question
        as an inline phantom next to the keyword.
        """
        try:
            phantoms = []
            
            # Find all regions matching our pattern (Keyword with empty predicate)
            regions = self.view.find_all(REGEX_PATTERN)
            
            for region in regions:
                # Extract the text, strip it to isolate the keyword, and normalize spaces
                # so that "Or    except" resolves to "or except".
                line_text = self.view.substr(region).strip().lower()
                keyword = re.sub(r'\s+', ' ', line_text)
                
                if keyword in QUESTIONS:
                    question = QUESTIONS[keyword]
                    
                    # Sublime minihtml styling for the phantom.
                    # color(var(--foreground) alpha(0.4)) adapts to the user's color scheme
                    # while keeping the hint ghosted out so it's not confused with real text.
                    html = """
                    <body id="trade-story-hint">
                        <style>
                            .hint {{
                                color: color(var(--foreground) alpha(0.4));
                                font-style: italic;
                                padding-left: 10px;
                            }}
                        </style>
                        <span class="hint">{question}</span>
                    </body>
                    """.format(question=question)
                    
                    # Create the phantom at the end of the matched region (after the keyword/spaces)
                    phantom = sublime.Phantom(
                        sublime.Region(region.end(), region.end()), 
                        html, 
                        sublime.LAYOUT_INLINE
                    )
                    phantoms.append(phantom)
            
            # Batch update the view's phantoms
            self.phantom_set.update(phantoms)
            
        except Exception as e:
            # Failsafe error boundary so we don't block the editor if something goes wrong
            print(f"Trade Story Hints Error: {e}")