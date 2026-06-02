function SquareSpinner({ size }) {
    return (
        <>
            <div className={`loader border-2 border-cyan-300 border-rounded-full w-4 h-4 animate-spin  [animation-duration:1.3s] ${size} `} />
        </>
    )
}

export default SquareSpinner;


