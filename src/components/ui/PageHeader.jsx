import "./PageHeader.css";

function PageHeader({

    titulo,
    subtitulo,
    children

}) {

    return (

        <div className="page-header">

            <div className="page-header-top">

                <div>

                    <h1 className="page-title">

                        {titulo}

                    </h1>

                    <p className="page-subtitle">

                        {subtitulo}

                    </p>

                </div>

                <div className="page-header-actions">

                    {children}

                </div>

            </div>

        </div>

    )

}

export default PageHeader;