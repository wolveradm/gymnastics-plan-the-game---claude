class HttpException(Exception):
    def __init__(self, status_code: int, message: str = "", data=None):
        self.status_code = status_code
        self.message = message
        self.data = data


class FileNotFoundException(HttpException):
    def __init__(self, message: str = "file not found"):
        super().__init__(status_code=404, message=message)
