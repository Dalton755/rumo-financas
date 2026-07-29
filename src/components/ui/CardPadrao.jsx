function CardPadrao({

    children,
    className = ''

}) {

    return (

        <div
            className={`
                card-padrao
                ${className}
            `}
        >

            {children}

        </div>

    )

}

export default CardPadrao