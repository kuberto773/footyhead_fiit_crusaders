export async function action() {
    const response = await fetch("http://192.168.0.201:2567/create");
    return response;
}
