import React, { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import { downloadCSV, loadConfig, listConfigNames }  from '../../../services/output.service.js'

export default function OutputComparisonTable(props) {
    let params = useParams(); 
    const { outputData } = props;
    const [ pastConfigs, setPastConfigs ] = useState([])
    const [ historyData, setHistoryData ] = useState([])
    const [ historyDataOrganized, setHistoryDataOrganized ] = useState([])
    const [ configData, setConfigData ] = React.useState([])
    const [leftConfigIndex, setLeftConfigIndex]  = React.useState(0)
    const [rightConfigIndex, setRightConfigIndex]  = React.useState(0)
    const [dense, setDense] = React.useState(true);
    const [ showTable, setShowTable ] = React.useState(false)

    
//   useEffect(()=>{   
//     console.log("in comparison table")
//     if (!showTable){
//       let temp = [...historyDataOrganized]
//       // temp.push(organizeOutput(outputData))
//       setConfigData(temp)
//       // console.log('configData', temp)
//       // console.log("historyDataOrganized", historyDataOrganized)
//       setShowTable(true)
//     }

// }, []);

useEffect(() => {
organizeVariables()
}, [historyData])

useEffect(()=>{   
  let history = []
  listConfigNames(params.id)
  .then(response => response.json())
  .then((data)=>{
    console.log("list config names:", data);
    setPastConfigs(data)
    console.log(data.length)
    var tempHistory = []
    for (const conf of data) {
      loadConfig(params.id, conf)
      .then(response => response.json())
      .then((data2)=>{
      tempHistory.push({name: conf.replaceAll('"',''), data:data2})
      setHistoryData([...tempHistory])
      // setLeftConfigIndex(tempHistory.length-1)
      }).catch((err)=>{
          console.error("unable to get load config: ",err)
      });
  }
  }).catch((err)=>{
      console.error("unable to get list of config names: ",err)
  })
  
}, []);

const organizeVariables = () => {
  var tempHistory = []
  for (const bvars of historyData) {
    let var_sections = {}
    let tempVariables = []
    let tempName = bvars.name
    // console.log('bvars',bvars)
    for (const [key, v] of Object.entries(bvars.data.model_objects)) {
        
        let catg = v.input_category
        if (catg === null) {
            catg = "Uncategorized"
        }
        if (!Object.hasOwn(var_sections, catg)) {
            var_sections[catg] = {display_name: catg, variables: {}}
        }
        tempVariables.push(v)
        // console.log('tempVariables', tempVariables)
        var_sections[catg]["variables"] = [...tempVariables]
    }
    tempHistory.push({name: tempName, data: var_sections})
    setHistoryDataOrganized([...tempHistory])
    setShowTable(true)
  }
  
}
    const handleLeftConfigSelection = (event) => {
      setLeftConfigIndex(event.target.value)
    }

    const handleRightConfigSelection = (event) => {
      setRightConfigIndex(event.target.value)
    }

    // const organizeOutput = (data) => {
    //   let var_sections = {}
    //   let tempVariables = []
    //   let tempName = data.name
    //   // console.log('bvars',bvars)
    //   for (const [key, v] of Object.entries(data.data.model_objects)) {
          
    //       let catg = v.input_category
    //       if (catg === null) {
    //           catg = "Uncategorized"
    //       }
    //       if (!Object.hasOwn(var_sections, catg)) {
    //           var_sections[catg] = {display_name: catg, variables: {}}
    //       }
    //       tempVariables.push(v)
    //       // console.log('tempVariables', tempVariables)
    //       var_sections[catg]["variables"] = [...tempVariables]
    //   }
    //   return {name: tempName, data: var_sections}
    // }

    const renderConfigurationSelect = (index) => {
        return <FormControl >
            <InputLabel id="demo-simple-select-label"></InputLabel>
            <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={index===0 ? leftConfigIndex : rightConfigIndex}
                label="Past Configurations"
                onChange={index===0 ? handleLeftConfigSelection : handleRightConfigSelection}
                variant='standard'
            >
                {historyDataOrganized.map((value, ind) => {
                    return <MenuItem key={value+ind} value={ind}>{value.name}</MenuItem>
                })}
            </Select>
        </FormControl>
    }

    const downloadSheet = () => {
      downloadCSV(params.id, [historyData[leftConfigIndex],historyData[rightConfigIndex]])
      .then(response => response.blob())
      .then((data)=>{
        const href = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = href;
        link.setAttribute('download', 'comparison_results.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    const renderRows = () => {


      return Object.keys(historyDataOrganized[leftConfigIndex].data).map((category,index)=>{ return ( <Fragment>
        <TableRow key={category+index}>
          <TableCell rowSpan={Object.keys(historyDataOrganized[leftConfigIndex].data[category].variables).length + 1}>
            <b>{category}</b>
          </TableCell>
        </TableRow>
        {historyDataOrganized[leftConfigIndex].data[category].variables.map((metric, index) => { return <TableRow key={index}>
            <TableCell>{metric.name}</TableCell>
            <TableCell>{metric.value+" "+metric.display_units}</TableCell>
            <TableCell>{historyDataOrganized[rightConfigIndex].data[category].variables[index].value+" "+historyDataOrganized[rightConfigIndex].data[category].variables[index].display_units}</TableCell>
            <TableCell align='right'>
              {(Math.round((metric.value-historyDataOrganized[rightConfigIndex].data[category].variables[index].value) * 100) / 100).toFixed(2)}</TableCell>
          </TableRow>
        })}
      </Fragment>
        )
        })
    }


    const renderComparisonTable = () => {
      return <Grid item xs={12}>
      <Paper>
        <Table style={{border:"1px solid #ddd"}} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow key="tablehead">
              <TableCell style={{ width: '15%' }}></TableCell>
              <TableCell style={{ width: '20%' }}>Metric</TableCell>
              <TableCell style={{ width: '25%' }}>{renderConfigurationSelect(0)}</TableCell>
              <TableCell style={{ width: '25%' }}>{renderConfigurationSelect(1)}</TableCell>
              <TableCell style={{ width: '15%' }}>Value Difference</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderRows()}
          </TableBody>
        </Table>
      </Paper>
      <Grid item xs={12}>
      {/* <Button variant="text" startIcon={<DownloadIcon />} onClick={downloadSheet}>Download Results</Button> */}
      </Grid>
      </Grid>
    }

  return (

        <Grid container spacing={0} alignItems="flex-start"> 
          <Grid item xs={12}>
            {  showTable &&
                renderComparisonTable()
            }
        </Grid>
        </Grid>
      
  );
}
