function Spinner() {
    return (
        <div className="flex justify-center items-center">
            {/* <div className="h-15 w-35 border-4 border-gray-300 border-t-red-500 border-b-blue-600 border-r-red-600 border-l-blue-600 rounded-full animate-spin"></div> */}
            <div className="loader border-t-4 border-cyan-300 rounded-full w-10 h-10 animate-spin mb-4"></div>

        </div>
    );
}

export default Spinner;
