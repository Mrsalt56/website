namespace ItalianBrainrotClicker.Pages;

public partial class GamePage : ContentPage
{
    private int score = 0;

    public GamePage()
    {
        InitializeComponent();
    }

    private async void OnCharacterTapped(object sender, EventArgs e)
    {
        score++;
        ScoreLabel.Text = $"Brainrot: {score}";

        // Efekt klikniêcia
        await CharacterImage.ScaleTo(0.85, 80);
        await CharacterImage.ScaleTo(1.0, 80);
    }
}
