namespace ItalianBrainrotClicker.Pages;

public partial class StartPage : ContentPage
{
    public StartPage()
    {
        InitializeComponent();
    }

    private async void OnStartClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(GamePage));
    }
}
