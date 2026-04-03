function sorting(number, type2)
{
    document.cookie = "sortAmount=" + number + "; path=/";
    document.cookie = "sortType=" + type2 + "; path=/";

    window.location.href = "/api/activitylog";
}
