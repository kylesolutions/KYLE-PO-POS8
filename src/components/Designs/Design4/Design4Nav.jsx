import React from 'react'

function Design4Nav() {
  return (
    <div className='container-fluid'>
                <div className='row' style={{ backgroundColor: "#edebeb", marginTop: "5px",marginBottom:"5px", borderRadius: "5px", height:"97vh"}}>
                    <ul className='d-flex justify-content-center'>
                        <div className='d-flex flex-column justify-content-between align-items-center'>
                            <div>
                                <li className='nav-li' style={{ listStyle: "none",cursor:"pointer" }}>
                                    <img src="\images\Logo.png" alt="" style={{ width: "100px", borderRadius: "10px", marginTop: "5px" }} />
                                </li>
                            </div>
                            <div style={{backgroundColor:"#cdcdcd", padding:"15px", borderRadius:"15px"}}>
                                <li className='nav-li' style={{ listStyle: "none", fontSize: "30px",cursor:"pointer" }}>
                                    <i class="bi bi-house-fill"></i>
                                </li>
                                <li style={{ listStyle: "none", fontSize: "30px",cursor:"pointer" }}>
                                    <i class="bi bi-file-spreadsheet-fill" ></i>
                                </li>
                                <li style={{ listStyle: "none", fontSize: "30px",cursor:"pointer" }}>
                                    <i class="bi bi-truck"></i>
                                </li>
                            </div>
                            <div>
                                <li style={{ listStyle:"none", fontSize:"30px",color:"grey",cursor:"pointer"}}>
                                    <i class="bi bi-cup"></i>
                                </li>
                                <li style={{ listStyle:"none", fontSize:"30px",color:"grey",cursor:"pointer"}}>
                                    <i class="bi bi-bag-dash"></i>
                                </li>
                                <li style={{ listStyle:"none", fontSize:"30px",color:"grey",cursor:"pointer"}}>
                                    <i class="bi bi-receipt"></i>
                                </li>
                                <li style={{ listStyle:"none", fontSize:"30px",color:"grey",cursor:"pointer"}}>
                                    <i class="bi bi-bookmarks"></i>
                                </li>

                            </div>
                            <div>
                                <li style={{ listStyle: "none" }}>
                                    <img src="\images\Profile.png" alt="" style={{width:"50px",borderRadius:"25px",cursor:"pointer"}} />
                                </li>
                            </div>
                        </div>

                    </ul>
                </div>
            </div>
  )
}

export default Design4Nav